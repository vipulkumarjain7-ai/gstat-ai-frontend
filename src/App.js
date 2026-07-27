import{useState,useEffect,useCallback,useRef,useMemo}from"react";

const API=process.env.REACT_APP_API||"https://gstat-ai-backend.onrender.com/api";
// Robust API base — ensure /api suffix, no double slashes
const getApiBase=()=>{
  let base=process.env.REACT_APP_API||"https://gstat-ai-backend.onrender.com/api";
  base=base.replace(/\/+$/,""); // remove trailing slashes
  if(!base.endsWith("/api"))base=base+"/api";
  return base;
};
const BASE=getApiBase();

const api=async(path,method="GET",body=null,token=null)=>{
  const headers={"Content-Type":"application/json"};
  if(token)headers["Authorization"]=`Bearer ${token}`;
  const url=`${BASE}${path.startsWith("/")?path:"/"+path}`;
  const res=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});
  let d;
  try{d=await res.json();}catch(e){throw new Error(`Server error (${res.status}). Check backend URL.`);}
  if(!d.success)throw new Error(d.message||"Request failed");
  return d;
};

// Robust FormData upload
const apiUpload=async(path,formData,token)=>{
  const url=`${BASE}${path.startsWith("/")?path:"/"+path}`;
  const res=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:formData});
  let d;
  try{d=await res.json();}catch(e){throw new Error(`Server error (${res.status}). Check backend URL.`);}
  if(!d.success)throw new Error(d.message||"Upload failed");
  return d;
};


// ── Design tokens — support light/dark/green themes ──────────────────────────
const THEMES={
  light:{bg:"#f5f6fa",card:"#ffffff",border:"#e2e8f0",text:"#1a2b4e",sub:"#4a5568",muted:"#94a3b8",green:"#0B6623",navy:"#1a2b4e",inputBg:"#fff",navBg:"#1a2b4e",headerBg:"#0B6623",shadow:"0 1px 4px rgba(0,0,0,0.06)"},
  dark:{bg:"#0d1117",card:"#161b22",border:"#30363d",text:"#e6edf3",sub:"#8b949e",muted:"#484f58",green:"#3fb950",navy:"#1f2937",inputBg:"#21262d",navBg:"#161b22",headerBg:"#0B6623",shadow:"0 1px 4px rgba(0,0,0,0.4)"},
  green:{bg:"#f0fdf4",card:"#ffffff",border:"#86efac",text:"#14532d",sub:"#166534",muted:"#4ade80",green:"#0B6623",navy:"#14532d",inputBg:"#fff",navBg:"#14532d",headerBg:"#0B6623",shadow:"0 1px 4px rgba(11,102,35,0.1)"},
};

let _theme="light";
const getC=()=>THEMES[_theme]||THEMES.light;

const today=()=>new Date().toISOString().split("T")[0];
const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
const fD=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
const REF_TYPES=[["act_section","GST Act Section"],["rule","GST Rule"],["circular","CBIC Circular"],["notification","Notification"],["gst_council","GST Council Rec."],["gstat_order","GSTAT Order"],["hc_order","High Court Order"],["sc_order","Supreme Court Order"],["aar","AAR / AAAR Order"],["user_upload","Own Upload"]];
const REF_COLORS={act_section:"blue",rule:"teal",circular:"purple",notification:"amber",gst_council:"green",gstat_order:"teal",hc_order:"blue",sc_order:"green",aar:"gray",user_upload:"gray"};
const STATUS_CONFIG={new:{label:"New",color:"gray"},documents_uploaded:{label:"Docs Uploaded",color:"blue"},research_done:{label:"Researched",color:"purple"},draft_generated:{label:"Draft Ready",color:"teal"},under_review:{label:"Under Review",color:"amber"},filed:{label:"Filed",color:"green"},decided:{label:"Decided",color:"green"},closed:{label:"Closed",color:"gray"}};
const PRIORITY_CONFIG={high:{label:"High",color:"red"},medium:{label:"Medium",color:"amber"},low:{label:"Low",color:"blue"}};
const DEADLINE_CONFIG={overdue:{label:"OVERDUE",color:"red"},critical:{label:"< 7 Days",color:"red"},warning:{label:"< 30 Days",color:"amber"},ok:{label:"OK",color:"green"}};
const APPEAL_FORUMS=["GST Appellate Tribunal (GSTAT)","Commissioner (Appeals)","Additional Commissioner (Appeals)","High Court","Supreme Court"];
const ORDER_TYPES=["Order-in-Original (OIO)","Show Cause Notice (SCN)","DRC-07 (Summary Demand)","ASMT-13 (Best Judgement)","ADT-04 (Audit Report)","REG-19 (Cancellation)","Other"];

// Dynamic styles based on theme
const getS=()=>{
  const C=getC();
  return{
    card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:16,marginBottom:12,boxShadow:C.shadow},
    input:{width:"100%",padding:"10px 14px",background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:6,fontSize:13,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
    select:{width:"100%",padding:"9px 12px",background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:6,fontSize:13,color:C.text,fontFamily:"inherit"},
    btn:{padding:"9px 18px",background:C.green,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"},
    btnO:{padding:"9px 18px",background:"transparent",color:C.navy,border:`1.5px solid ${C.border}`,borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit"},
    btnR:{padding:"7px 14px",background:"#fff1f0",color:"#c53030",border:"1px solid #feb2b2",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
    th:{padding:"9px 12px",background:C.bg,borderBottom:`1.5px solid ${C.border}`,textAlign:"left",fontSize:11,fontWeight:700,color:C.sub,whiteSpace:"nowrap"},
    td:{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.text,verticalAlign:"middle"},
    tdR:{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.text,textAlign:"right"},
    tbl:{width:"100%",borderCollapse:"collapse"},
    label:{display:"block",fontSize:11,fontWeight:600,color:C.sub,marginBottom:4},
    fg:{marginBottom:12},
    col2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
    col3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12},
    kpi:{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",textAlign:"center"},
  };
};

function Spinner(){const C=getC();return(<div style={{textAlign:"center",padding:40,color:C.muted}}><div style={{display:"inline-block",width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.green,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>);}
function Toast({msg,type,onClose}){useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);const bg=type==="error"?"#fff1f0":type==="success"?"#f0fdf4":"#fffbeb";const color=type==="error"?"#c53030":type==="success"?"#166534":"#92400e";return(<div style={{position:"fixed",bottom:20,right:20,maxWidth:380,padding:"12px 16px",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",background:bg,color,fontSize:13,zIndex:999,display:"flex",alignItems:"flex-start",gap:10}}><span style={{flex:1}}>{msg}</span><button onClick={onClose} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:16}}>✕</button></div>);}
function Modal({title,onClose,children,wide}){const C=getC();return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}><div style={{background:C.card,borderRadius:10,width:"100%",maxWidth:wide?780:500,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}><div style={{fontWeight:700,fontSize:15,color:C.text}}>{title}</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>✕</button></div><div style={{padding:20}}>{children}</div></div></div>);}

function badge(text,color="blue"){const map={green:["#f0fdf4","#166534","#86efac"],red:["#fff1f0","#c53030","#feb2b2"],amber:["#fffbeb","#92400e","#fcd34d"],blue:["#eff6ff","#1d4ed8","#bfdbfe"],purple:["#faf5ff","#6b21a8","#d8b4fe"],gray:["#f8fafc","#475569","#cbd5e1"],teal:["#f0fdfa","#0f766e","#5eead4"]};const[bg,fg,border]=map[color]||map.blue;return<span style={{background:bg,color:fg,border:`1px solid ${border}`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{text}</span>;}

// ── Auth helpers at module level ──────────────────────────────────────────────
const GInput=({type="text",label,placeholder,value,onChange,onEnter,maxLength,autoFocus,disabled,hint})=>{const C=getC();const S=getS();return(<div style={S.fg}>{label&&<label style={S.label}>{label}</label>}<input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus} disabled={disabled} onChange={e=>onChange(e.target.value)} maxLength={maxLength} onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()} style={{...S.input,background:disabled?C.bg:C.inputBg}}/>{hint&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{hint}</div>}</div>);};
const GBtn=({onClick,children,disabled,loading,variant="primary",full=true,style:ex={}})=>{const C=getC();const S=getS();return(<button onClick={onClick} disabled={disabled||loading} style={{...(variant==="primary"?S.btn:S.btnO),width:full?"100%":"auto",padding:12,opacity:disabled||loading?0.6:1,...ex}}>{loading?"Please wait…":children}</button>);};


// ── Math CAPTCHA helper (module-level) ──────────────────────────────────────
function genCaptcha(){
  const ops=['+','+','+','-','-'];
  const op=ops[Math.floor(Math.random()*ops.length)];
  const a=Math.floor(Math.random()*9)+1;
  const b=Math.floor(Math.random()*9)+1;
  const ans=op==='+'?a+b:a-b;
  return{question:`${a} ${op} ${b} = ?`,answer:String(ans)};
}

// ── AuthScreen ────────────────────────────────────────────────────────────────
// ── AUTH COMPONENTS — module level (NEVER inside a function — prevents focus loss) ──
const AuthInp=({label,type="text",placeholder,value,onChange,onEnter,maxLength,autoFocus,hint,C,inp})=>(
  <div style={{marginBottom:12}}>
    {label&&<div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>{label}</div>}
    <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
      onChange={e=>onChange(e.target.value)} maxLength={maxLength}
      onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()}
      style={inp}/>
    {hint&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{hint}</div>}
  </div>
);
const AuthBtn=({onClick,children,variant="green",loading,warming,C,border})=>(
  <button onClick={onClick} disabled={loading||warming}
    style={{width:"100%",padding:13,
      background:variant==="green"?"#0B6623":variant==="navy"?"#1a2b4e":"transparent",
      color:variant==="outline"?"#1a2b4e":"#fff",
      border:variant==="outline"?`1.5px solid ${border||"#e2e8f0"}`:"none",
      borderRadius:7,fontSize:13,fontWeight:700,
      cursor:loading||warming?"not-allowed":"pointer",
      opacity:loading||warming?0.7:1,fontFamily:"inherit"}}>
    {loading?"Please wait…":warming?"Connecting…":children}
  </button>
);
const AuthErrBox=({err})=>err?<div style={{background:"#fff1f0",border:"1px solid #feb2b2",color:"#c53030",padding:"10px 14px",borderRadius:7,fontSize:13,marginBottom:14,lineHeight:1.5}}>⚠ {err}</div>:null;
const AuthSuccBox=({success})=>success?<div style={{background:"#f0fdf4",border:"1px solid #86efac",color:"#166534",padding:"10px 14px",borderRadius:7,fontSize:13,marginBottom:14}}>✅ {success}</div>:null;


function AuthScreen({onAuth}){
  // ── States ──
  const[tab,setTab]=useState("login");
  // login states
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[loginMode,setLoginMode]=useState("form"); // form | otp2fa
  const[loginOtpToken,setLoginOtpToken]=useState(null);
  const[loginOtpSentTo,setLoginOtpSentTo]=useState("");
  const[loginOtpCode,setLoginOtpCode]=useState("");
  // captcha
  const[captcha,setCaptcha]=useState(()=>genCaptcha());
  const[captchaInput,setCaptchaInput]=useState("");
  // register states
  const[regName,setRegName]=useState("");
  const[regFirm,setRegFirm]=useState("");
  const[regEmail,setRegEmail]=useState("");
  const[regPhone,setRegPhone]=useState("");
  const[regPass,setRegPass]=useState("");
  const[regRole,setRegRole]=useState("advocate");
  // email verify states (after register)
  const[verifyToken,setVerifyToken]=useState(null);
  const[verifyEmail,setVerifyEmail]=useState("");
  const[verifyCode,setVerifyCode]=useState("");
  // phone OTP states
  const[phone,setPhone]=useState("");
  const[phoneStep,setPhoneStep]=useState("input");
  const[phoneOtpToken,setPhoneOtpToken]=useState(null);
  const[phoneOtpSentTo,setPhoneOtpSentTo]=useState("");
  const[phoneOtpCode,setPhoneOtpCode]=useState("");
  // forgot password states
  const[forgotEmail,setForgotEmail]=useState("");
  const[forgotStep,setForgotStep]=useState("email"); // email | otp | newpass
  const[forgotResetToken,setForgotResetToken]=useState(null);
  const[forgotSentTo,setForgotSentTo]=useState("");
  const[forgotOtpCode,setForgotOtpCode]=useState("");
  const[newPassword,setNewPassword]=useState("");
  const[newPasswordConfirm,setNewPasswordConfirm]=useState("");
  // ui states
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[success,setSuccess]=useState("");
  const[serverStatus,setServerStatus]=useState("checking");

  useEffect(()=>{
    const t=setTimeout(()=>setServerStatus("slow"),10000);
    fetch(`${API.replace("/api","")}/health`)
      .then(()=>{clearTimeout(t);setServerStatus("awake");})
      .catch(()=>{clearTimeout(t);setServerStatus("awake");});
    return()=>clearTimeout(t);
  },[]);

  const finish=d=>{
    localStorage.setItem("gs_token",d.token);
    localStorage.setItem("gs_user",JSON.stringify(d.user));
    onAuth(d.user,d.token);
  };
  const sw=t=>{setTab(t);setErr("");setSuccess("");setLoginMode("form");setPhoneStep("input");setCaptcha(genCaptcha());setCaptchaInput("");};
  const refreshCaptcha=()=>{setCaptcha(genCaptcha());setCaptchaInput("");};

  // ── Login ──
  const doLogin=async()=>{
    if(!email||!password)return setErr("Email and password required");
    if(captchaInput!==captcha.answer)return setErr(`Incorrect captcha. Hint: ${captcha.question}`);
    setErr("");setLoading(true);
    try{
      const d=await api("/auth/login","POST",{email,password},null);
      if(d.require_otp){setLoginOtpToken(d.otp_token);setLoginOtpSentTo(d.sent_to||"");setLoginMode("otp2fa");}
      else finish(d);
    }catch(e){setErr(e.message);refreshCaptcha();}
    setLoading(false);
  };

  const doVerify2FA=async()=>{
    if(!loginOtpCode||loginOtpCode.length<6)return setErr("Enter 6-digit OTP");
    setErr("");setLoading(true);
    try{const d=await api("/auth/verify-otp","POST",{otp_token:loginOtpToken,code:loginOtpCode},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };

  // ── Register ──
  const doRegister=async()=>{
    if(!regName||!regEmail||!regPass||!regFirm||!regPhone)return setErr("All fields are mandatory");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail))return setErr("Enter a valid email address (e.g. name@gmail.com)");
    if(regPhone.replace(/\D/g,"").length!==10)return setErr("Enter valid 10-digit mobile number");
    if(regPass.length<8)return setErr("Password must be at least 8 characters");
    setErr("");setSuccess("");setLoading(true);
    try{
      const d=await api("/auth/register","POST",{name:regName,email:regEmail,password:regPass,firm_name:regFirm,phone:regPhone.replace(/\D/g,""),role:regRole},null);
      if(d.require_email_verify){
        setVerifyToken(d.verify_token);setVerifyEmail(d.sent_to);
        setTab("verify_email");setErr("");
      }else{finish(d);}
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const doVerifyEmail=async()=>{
    if(!verifyCode||verifyCode.length<6)return setErr("Enter 6-digit OTP from your email");
    setErr("");setLoading(true);
    try{const d=await api("/auth/verify-email","POST",{verify_token:verifyToken,code:verifyCode},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };

  // ── Phone OTP ──
  const doSendPhoneOtp=async()=>{
    const cleaned=phone.replace(/\D/g,"");
    if(cleaned.length!==10)return setErr("Enter valid 10-digit mobile number");
    setErr("");setLoading(true);
    try{const d=await api("/auth/phone-otp-request","POST",{phone:cleaned},null);
      setPhoneOtpToken(d.otp_token);setPhoneOtpSentTo(d.sent_to||"");setPhoneStep("otp");
    }catch(e){setErr(e.message);}setLoading(false);
  };
  const doVerifyPhoneOtp=async()=>{
    if(!phoneOtpCode||phoneOtpCode.length<6)return setErr("Enter 6-digit OTP");
    setErr("");setLoading(true);
    try{const d=await api("/auth/phone-otp-verify","POST",{otp_token:phoneOtpToken,code:phoneOtpCode},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };

  // ── Forgot Password ──
  const doForgotSend=async()=>{
    if(!forgotEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail))return setErr("Enter a valid email address");
    setErr("");setLoading(true);
    try{
      const d=await api("/auth/forgot-password","POST",{email:forgotEmail},null);
      if(d.reset_token){setForgotResetToken(d.reset_token);setForgotSentTo(d.sent_to||forgotEmail);setForgotStep("otp");}
      else setErr(d.message||"If this email is registered, OTP has been sent.");
    }catch(e){setErr(e.message);}
    setLoading(false);
  };
  const doForgotVerifyOtp=async()=>{
    if(!forgotOtpCode||forgotOtpCode.length<6)return setErr("Enter 6-digit OTP");
    setErr("");setForgotStep("newpass");
  };
  const doResetPassword=async()=>{
    if(!newPassword||newPassword.length<8)return setErr("Password must be at least 8 characters");
    if(newPassword!==newPasswordConfirm)return setErr("Passwords do not match");
    setErr("");setLoading(true);
    try{
      const d=await api("/auth/reset-password","POST",{reset_token:forgotResetToken,code:forgotOtpCode,new_password:newPassword},null);
      setSuccess("✅ Password reset successfully! Please login with your new password.");
      setTab("login");setForgotStep("email");setForgotEmail("");setForgotOtpCode("");setNewPassword("");setNewPasswordConfirm("");
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const warming=serverStatus==="checking";
  const C={green:"#0B6623",navy:"#1a2b4e",border:"#e2e8f0",muted:"#94a3b8",text:"#1a2b4e",sub:"#4a5568"};
  const inp={width:"100%",padding:"11px 14px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,color:"#1a2b4e",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};





  return(
    <div style={{minHeight:"100vh",background:"#f5f6fa",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:C.green,padding:"0 24px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:42,height:42,background:"#fff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.green}}>G</div>
          <div><div style={{color:"#fff",fontWeight:800,fontSize:17}}>GSTAT AI</div><div style={{color:"rgba(255,255,255,0.75)",fontSize:10}}>AI-Powered GST Litigation Platform</div></div>
        </div>
        <div>
          {serverStatus==="slow"&&<span style={{fontSize:10,color:"#fbbf24"}}>⏳ Server waking up... (~30-60s on free plan)</span>}
          {serverStatus==="awake"&&<span style={{fontSize:10,color:"#86efac"}}>✅ Server ready</span>}
        </div>
      </div>
      <div style={{background:C.navy,padding:"8px 24px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>🏠 Home</span>
        <span style={{color:"rgba(255,255,255,0.3)"}}>›</span>
        <span style={{color:"#fff",fontSize:11,fontWeight:600}}>
          {tab==="forgot"?"Forgot Password":tab==="verify_email"?"Verify Email":"Login / Register"}
        </span>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px"}}>
        <div style={{width:"100%",maxWidth:460,background:"#fff",borderRadius:10,boxShadow:"0 4px 24px rgba(0,0,0,0.1)",overflow:"hidden"}}>
          <div style={{background:C.navy,padding:"18px 24px"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:16}}>
              {tab==="verify_email"?"📧 Verify Your Email":tab==="forgot"?"🔑 Reset Password":"🔐 Login to GSTAT AI"}
            </div>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,marginTop:3}}>GST Litigation & Appeal Drafting Platform</div>
          </div>

          <div style={{padding:24}}>
            {/* Tab bar */}
            {tab!=="verify_email"&&tab!=="forgot"&&(
              <div style={{display:"flex",background:"#f0f2f5",borderRadius:7,padding:4,marginBottom:20}}>
                {[["login","📧 Email"],["phone","📱 Mobile OTP"],["register","✏️ Register"]].map(([k,l])=>(
                  <button key={k} onClick={()=>sw(k)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:tab===k?700:400,fontFamily:"inherit",background:tab===k?"#fff":"transparent",color:tab===k?C.navy:C.muted,boxShadow:tab===k?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{l}</button>
                ))}
              </div>
            )}

            <ErrBox/><SuccBox/>

            {/* ── EMAIL VERIFY ── */}
            {tab==="verify_email"&&(
              <div>
                <div style={{background:"#f0fdf4",border:"2px solid #86efac",borderRadius:8,padding:18,marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:36,marginBottom:8}}>📧</div>
                  <div style={{fontWeight:700,color:"#166534",fontSize:15,marginBottom:4}}>OTP Sent!</div>
                  <div style={{fontSize:12,color:"#166534",marginBottom:6}}>We sent a 6-digit OTP to:</div>
                  <div style={{fontWeight:800,color:C.green,fontSize:14,fontFamily:"monospace",letterSpacing:1}}>{verifyEmail}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:8}}>📥 Check your inbox and spam folder · ⏰ Valid for 30 minutes</div>
                </div>
                <Inp label="Enter 6-Digit OTP *" placeholder="0  0  0  0  0  0" value={verifyCode}
                  onChange={v=>setVerifyCode(v.replace(/\D/g,"").slice(0,6))}
                  onEnter={doVerifyEmail} maxLength={6} autoFocus
                  hint="If OTP not received, check spam folder or contact admin to verify SMTP settings"/>
                <Btn onClick={doVerifyEmail}>✅ Verify & Activate Account →</Btn>
                <button onClick={()=>{sw("register");setVerifyToken(null);}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",marginTop:10,textDecoration:"underline",display:"block"}}>← Back to Register</button>
              </div>
            )}

            {/* ── EMAIL LOGIN ── */}
            {tab==="login"&&loginMode==="form"&&(
              <div>
                <Inp label="Email ID *" placeholder="yourname@email.com" value={email} onChange={setEmail}/>
                <Inp label="Password *" type="password" placeholder="••••••••" value={password} onChange={setPassword} onEnter={doLogin}/>
                {/* Math CAPTCHA */}
                <div style={{background:"#f8fafc",border:`1.5px solid ${C.border}`,borderRadius:7,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.sub,marginBottom:8}}>🔒 Security Check (Anti-bot)</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{background:C.navy,color:"#fff",padding:"8px 16px",borderRadius:6,fontSize:16,fontWeight:700,fontFamily:"monospace",letterSpacing:2,minWidth:100,textAlign:"center"}}>{captcha.question}</div>
                    <input value={captchaInput} onChange={e=>setCaptchaInput(e.target.value.trim())}
                      placeholder="Answer" maxLength={4}
                      style={{...inp,width:80,textAlign:"center",fontSize:18,fontWeight:700}}
                      onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
                    <button onClick={refreshCaptcha} title="New question" style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted}}>🔄</button>
                  </div>
                </div>
                <Btn onClick={doLogin}>Login →</Btn>
                <button onClick={()=>{setTab("forgot");setForgotEmail(email);setErr("");setSuccess("");}} style={{background:"none",border:"none",color:C.green,fontSize:12,cursor:"pointer",marginTop:10,display:"block",textDecoration:"underline"}}>🔑 Forgot Password?</button>
              </div>
            )}
            {tab==="login"&&loginMode==="otp2fa"&&(
              <div>
                <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:7,padding:"10px 14px",fontSize:12,color:"#166534",marginBottom:14}}>✅ OTP sent to {loginOtpSentTo}</div>
                <Inp label="Enter OTP *" placeholder="000000" value={loginOtpCode} onChange={setLoginOtpCode} onEnter={doVerify2FA} maxLength={6} autoFocus/>
                <Btn onClick={doVerify2FA}>Verify OTP →</Btn>
                <button onClick={()=>{setLoginMode("form");setErr("");}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",marginTop:8,textDecoration:"underline"}}>← Back</button>
              </div>
            )}

            {/* ── PHONE OTP ── */}
            {tab==="phone"&&phoneStep==="input"&&(
              <div>
                <Inp label="Registered Mobile Number *" placeholder="10-digit mobile number" value={phone}
                  onChange={v=>setPhone(v.replace(/\D/g,"").slice(0,10))} onEnter={doSendPhoneOtp} maxLength={10}
                  hint="OTP will be sent to your registered email address"/>
                <Btn onClick={doSendPhoneOtp}>Send OTP →</Btn>
              </div>
            )}
            {tab==="phone"&&phoneStep==="otp"&&(
              <div>
                <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:7,padding:"10px 14px",fontSize:12,color:"#166534",marginBottom:14}}>✅ OTP sent to {phoneOtpSentTo}</div>
                <Inp label="Enter OTP *" placeholder="000000" value={phoneOtpCode} onChange={setPhoneOtpCode} onEnter={doVerifyPhoneOtp} maxLength={6} autoFocus/>
                <Btn onClick={doVerifyPhoneOtp}>Verify & Login →</Btn>
                <button onClick={()=>{setPhoneStep("input");setErr("");}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",marginTop:8,textDecoration:"underline"}}>← Change number</button>
              </div>
            )}

            {/* ── REGISTER ── */}
            {tab==="register"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Inp label="Full Name *" placeholder="Adv. Rajesh Sharma" value={regName} onChange={setRegName}/>
                  <Inp label="Firm Name *" placeholder="Sharma & Associates" value={regFirm} onChange={setRegFirm}/>
                </div>
                <Inp label="Email ID * (OTP will be sent here to verify your account)" type="email" placeholder="yourname@gmail.com" value={regEmail} onChange={setRegEmail}/>
                <Inp label="Mobile Number *" placeholder="10-digit mobile number" value={regPhone} onChange={v=>setRegPhone(v.replace(/\D/g,"").slice(0,10))} maxLength={10}/>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Role *</div>
                  <select value={regRole} onChange={e=>setRegRole(e.target.value)} style={inp}>
                    {[["advocate","Advocate / Lawyer"],["ca","Chartered Accountant"],["staff","Staff / Junior"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <Inp label="Password * (minimum 8 characters)" type="password" placeholder="••••••••" value={regPass} onChange={setRegPass} onEnter={doRegister}/>
                <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:7,padding:"10px 14px",fontSize:11,color:"#92400e",marginBottom:14}}>
                  ⚠️ OTP will be sent to your email for verification. Make sure your email address is correct and SMTP is configured on the server.
                </div>
                <Btn onClick={doRegister}>Create Account & Send Verification OTP →</Btn>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab==="forgot"&&forgotStep==="email"&&(
              <div>
                <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,padding:"12px 14px",fontSize:12,color:"#1d4ed8",marginBottom:16}}>
                  🔑 Enter your registered email address. We will send a 6-digit OTP to reset your password.
                </div>
                <Inp label="Registered Email ID *" type="email" placeholder="yourname@email.com" value={forgotEmail} onChange={setForgotEmail} onEnter={doForgotSend} autoFocus/>
                <Btn onClick={doForgotSend}>Send Reset OTP →</Btn>
                <button onClick={()=>{sw("login");}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",marginTop:10,textDecoration:"underline",display:"block"}}>← Back to Login</button>
              </div>
            )}
            {tab==="forgot"&&forgotStep==="otp"&&(
              <div>
                <div style={{background:"#f0fdf4",border:"2px solid #86efac",borderRadius:8,padding:16,marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:6}}>📧</div>
                  <div style={{fontWeight:700,color:"#166534",marginBottom:4}}>OTP Sent!</div>
                  <div style={{fontSize:12,color:"#166534"}}>Password reset OTP sent to:</div>
                  <div style={{fontWeight:800,color:C.green,fontSize:13,fontFamily:"monospace",marginTop:4}}>{forgotSentTo}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:6}}>⏰ Valid for 15 minutes · Check spam folder too</div>
                </div>
                <Inp label="Enter 6-Digit OTP *" placeholder="0  0  0  0  0  0" value={forgotOtpCode} onChange={v=>setForgotOtpCode(v.replace(/\D/g,"").slice(0,6))} onEnter={doForgotVerifyOtp} maxLength={6} autoFocus/>
                <Btn onClick={doForgotVerifyOtp}>Verify OTP →</Btn>
                <button onClick={()=>setForgotStep("email")} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",marginTop:10,textDecoration:"underline",display:"block"}}>← Resend OTP</button>
              </div>
            )}
            {tab==="forgot"&&forgotStep==="newpass"&&(
              <div>
                <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:7,padding:"10px 14px",fontSize:12,color:"#166534",marginBottom:14}}>✅ OTP verified! Set your new password below.</div>
                <Inp label="New Password * (minimum 8 characters)" type="password" placeholder="••••••••" value={newPassword} onChange={setNewPassword}/>
                <Inp label="Confirm New Password *" type="password" placeholder="••••••••" value={newPasswordConfirm} onChange={setNewPasswordConfirm} onEnter={doResetPassword}/>
                <Btn onClick={doResetPassword}>✅ Reset Password →</Btn>
              </div>
            )}

            {warming&&tab!=="verify_email"&&(
              <div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:12,padding:"8px",background:"#f8fafc",borderRadius:6}}>
                ⏳ Connecting... This may take 30-60 seconds on free plan (cold start)
              </div>
            )}
          </div>
          <div style={{background:"#f8fafc",padding:"10px 24px",borderTop:"1px solid #e2e8f0",fontSize:10,color:C.muted,textAlign:"center"}}>
            GSTAT AI · Enterprise GST Litigation Platform · Data encrypted at rest
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main App Shell ────────────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("gs_user"));}catch{return null;}});
  const[token,setToken]=useState(()=>localStorage.getItem("gs_token")||"");
  const[view,setView]=useState("dashboard");
  const[toast,setToast]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[mobileOpen,setMobileOpen]=useState(false);
  const[activeNav,setActiveNav]=useState(null);
  const[theme,setTheme]=useState(()=>localStorage.getItem("gs_theme")||"light");

  // Apply theme globally
  _theme=theme;
  const C=getC();const S=getS();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4500);};
  const logout=()=>{api("/auth/logout","POST",null,token).catch(()=>{});localStorage.clear();setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};
  const go=k=>{setView(k);setMobileOpen(false);setActiveNav(null);};
  const changeTheme=t=>{setTheme(t);localStorage.setItem("gs_theme",t);_theme=t;};

  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).catch(()=>{});},[]);
  useEffect(()=>{if(token)api("/admin/me","GET",null,token).then(d=>setIsAdmin(!!d.is_admin)).catch(()=>{});},[token]);
  useEffect(()=>{
    if(!token)return;
    const ping=()=>api("/auth/heartbeat","POST",null,token).catch(()=>{});
    ping();const id=setInterval(ping,5*60*1000);return()=>clearInterval(id);
  },[token]);

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const NAV_GROUPS=[
    {group:"MAIN",icon:"🏠",items:[{key:"dashboard",icon:"🏠",label:"Dashboard"}]},
    {group:"CLIENTS",icon:"👥",items:[{key:"clients",icon:"👥",label:"Clients"}]},
    {group:"CASES",icon:"📋",items:[{key:"cases",icon:"📋",label:"All Cases"},{key:"cases-new",icon:"➕",label:"New Case"}]},
    {group:"LEGAL LIBRARY",icon:"📚",items:[{key:"library",icon:"📚",label:"Legal Library"}]},
    {group:"APPEAL DRAFTING",icon:"⚖️",items:[{key:"appeals",icon:"⚖️",label:"Appeals"}]},
    {group:"AI TOOLS",icon:"🤖",items:[{key:"research",icon:"🔍",label:"AI Research"},{key:"chat",icon:"💬",label:"AI Chat"}]},
    {group:"SETTINGS",icon:"⚙️",items:[{key:"settings",icon:"⚙️",label:"Settings"}]},
    ...(isAdmin?[{group:"ADMIN",icon:"👑",items:[{key:"admin",icon:"👑",label:"Admin Panel"}]}]:[]),
  ];
  const allItems=NAV_GROUPS.flatMap(g=>g.items);
  const currentLabel=allItems.find(i=>i.key===view)?.label||"Dashboard";

  return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",color:C.text}}>
    {/* Top Header */}
    <div style={{background:"#0B6623",height:56,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,background:"#fff",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:"#0B6623"}}>G</div>
        <div><div style={{color:"#fff",fontWeight:800,fontSize:15}}>GSTAT AI</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:9}}>GST Litigation Platform</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.85)",display:window.innerWidth<768?"none":"block"}}>{user.name} · {user.role?.toUpperCase()}</span>

        <button onClick={logout} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:5,color:"#fff",fontSize:11,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        <button onClick={()=>setMobileOpen(p=>!p)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:5,color:"#fff",fontSize:16,padding:"3px 10px",cursor:"pointer",display:window.innerWidth<768?"block":"none"}}>☰</button>
      </div>
    </div>

    {/* Nav Bar */}
    <div style={{background:C.navBg,borderBottom:`2px solid #0B6623`,flexShrink:0,overflowX:"auto",display:window.innerWidth<768?"none":"block"}}>
      <div style={{display:"inline-flex",height:42,alignItems:"stretch"}}>
        {NAV_GROUPS.map(({group,icon,items})=>(
          <div key={group} style={{position:"relative"}} onMouseEnter={()=>setActiveNav(group)} onMouseLeave={()=>setActiveNav(null)}>
            <button style={{height:42,padding:"0 16px",border:"none",background:activeNav===group?"rgba(255,255,255,0.08)":"transparent",
              color:items.some(i=>i.key===view)?"#fff":"rgba(255,255,255,0.7)",cursor:"pointer",fontFamily:"inherit",
              fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",
              borderBottom:items.some(i=>i.key===view)?`3px solid #0B6623`:"3px solid transparent"}}>
              {icon} {group} {items.length>1&&<span style={{fontSize:9}}>▾</span>}
            </button>
            {activeNav===group&&(
              <div style={{position:"absolute",top:42,left:0,background:C.card,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",borderRadius:"0 0 8px 8px",minWidth:190,zIndex:100,borderTop:`3px solid #0B6623`}}>
                {items.map(n=>(
                  <button key={n.key} onClick={()=>go(n.key)}
                    style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 18px",border:"none",background:view===n.key?"#f0fdf4":C.card,color:view===n.key?"#0B6623":C.text,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:view===n.key?700:400,borderLeft:view===n.key?`3px solid #0B6623`:"3px solid transparent"}}>
                    {n.icon} {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Mobile Drawer */}
    {mobileOpen&&(<>
      <div onClick={()=>setMobileOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:148}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:270,background:C.card,zIndex:149,overflowY:"auto",boxShadow:"4px 0 20px rgba(0,0,0,0.2)"}}>
        <div style={{background:"#0B6623",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#fff",fontWeight:700}}>GSTAT AI</span>
          <button onClick={()=>setMobileOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {NAV_GROUPS.map(({group,icon,items})=>(<div key={group}>
          <div style={{fontSize:10,color:C.muted,padding:"10px 16px 4px",fontWeight:700,letterSpacing:1,background:C.bg}}>{group}</div>
          {items.map(n=><button key={n.key} onClick={()=>go(n.key)}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",border:"none",background:view===n.key?"#f0fdf4":C.card,color:view===n.key?"#0B6623":C.text,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:view===n.key?700:400,borderLeft:view===n.key?`3px solid #0B6623`:"3px solid transparent"}}>
            {n.icon} {n.label}
          </button>)}
        </div>))}
      </div>
    </>)}

    {/* Breadcrumb */}
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"6px 18px",display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.muted,flexShrink:0}}>
      <span onClick={()=>go("dashboard")} style={{cursor:"pointer",color:"#0B6623",fontWeight:600}}>🏠 Home</span>
      <span>›</span><span style={{color:C.text,fontWeight:600}}>{currentLabel}</span>
    </div>

    {/* Content */}
    <div style={{flex:1,padding:18,overflowY:"auto"}}>
      {view==="dashboard"     &&<GSTATDashboard token={token} toast={showToast} go={go} isAdmin={isAdmin}/>}
      {view==="clients"       &&<ClientManager token={token} toast={showToast}/>}
      {view==="cases"         &&<CaseList token={token} toast={showToast} go={go}/>}
      {view==="cases-new"     &&<CaseForm token={token} toast={showToast} go={go} onSaved={()=>go("cases")}/>}
      {view==="library"       &&<LegalLibrary token={token} toast={showToast} isAdmin={isAdmin}/>}
      {view==="appeals"       &&<AppealManager token={token} toast={showToast} go={go}/>}
      {view==="research"      &&<AIResearch token={token} toast={showToast}/>}
      {view==="chat"          &&<AIChat token={token} toast={showToast}/>}
      {view==="settings"      &&<UserSettings token={token} user={user} toast={showToast} onLogout={logout} isAdmin={isAdmin} theme={theme} onThemeChange={changeTheme}/>}
      {view==="admin"         &&isAdmin&&<AdminPanel token={token} toast={showToast}/>}
    </div>
    {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function GSTATDashboard({token,toast,go,isAdmin}){
  const C=getC();const S=getS();
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{api("/dashboard","GET",null,token).then(d=>{setStats(d);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  if(loading)return<Spinner/>;
  const s=stats?.stats||{};

  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Banner */}
    <div style={{background:"linear-gradient(135deg,#0B6623,#1a2b4e)",borderRadius:10,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{color:"#fff",fontWeight:800,fontSize:20,marginBottom:4}}>⚖️ GSTAT AI Dashboard</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>AI-Powered GST Litigation · Every citation from your Legal Library only</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>go("cases-new")} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.4)",color:"#fff",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>+ New Case</button>
        <button onClick={()=>go("appeals")} style={{background:"#fff",border:"none",color:"#0B6623",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>⚖️ Draft Appeal</button>
      </div>
    </div>

    {/* KPI Row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
      {[[`${s.total_clients||0}`,"👥","Clients","#1a2b4e","clients"],
        [`${s.total_cases||0}`,"📋","Total Cases","#0B6623","cases"],
        [`${s.open_cases||0}`,"🔓","Open Cases","#2563eb","cases"],
        [`${s.critical_deadline_cases||0}`,"🚨","Critical","#dc2626","cases"],
        [`${s.filed_cases||0}`,"✅","Filed","#16a34a","cases"],
        [fR(s.total_demand),"💰","Total Demand","#9333ea",null],
      ].map(([val,icon,label,color,key])=>(
        <div key={label} onClick={()=>key&&go(key)}
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 14px",
            cursor:key?"pointer":"default",borderTop:`4px solid ${color}`,boxShadow:C.shadow,
            transition:"transform 0.15s"}}
          onMouseEnter={e=>key&&(e.currentTarget.style.transform="translateY(-2px)")}
          onMouseLeave={e=>key&&(e.currentTarget.style.transform="")}>
          <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
          <div style={{fontSize:label==="Total Demand"?14:26,fontWeight:900,color,lineHeight:1,marginBottom:4}}>{val}</div>
          <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</div>
        </div>
      ))}
    </div>

    {/* Critical alert */}
    {s.critical_deadline_cases>0&&(
      <div style={{background:"#fff1f0",border:"2px solid #fca5a5",borderRadius:8,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>🚨</span>
        <div style={{flex:1}}><div style={{fontWeight:700,color:"#c53030"}}>{s.critical_deadline_cases} case(s) — Deadline within 7 days!</div><div style={{fontSize:11,color:"#c53030",opacity:0.8}}>Take immediate action to avoid limitation expiry</div></div>
        <button onClick={()=>go("cases")} style={{background:"#c53030",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>View Cases →</button>
      </div>
    )}

    {/* Library alert */}
    {!s.total_legal_refs&&(
      <div style={{background:"#fffbeb",border:"2px solid #fcd34d",borderRadius:8,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>⚠️</span>
        <div style={{flex:1}}><div style={{fontWeight:700,color:"#92400e"}}>Legal Library is Empty!</div><div style={{fontSize:11,color:"#92400e"}}>AI cannot cite any references without a library. Upload GST Act sections, Rules, Circulars and Court orders first.</div></div>
        <button onClick={()=>go("library")} style={{background:"#0B6623",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>+ Upload Now</button>
      </div>
    )}

    {/* 2 column — cases + hearings */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:C.shadow}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg}}>
          <span style={{fontWeight:700,color:C.text,fontSize:13}}>📋 Recent Cases</span>
          <button onClick={()=>go("cases")} style={{background:"none",border:"none",color:"#0B6623",cursor:"pointer",fontSize:11,fontWeight:700}}>View All →</button>
        </div>
        {stats?.recent_cases?.length>0?stats.recent_cases.map(c=>(
          <div key={c.id} onClick={()=>go("cases")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
            <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:c.deadline_status==="overdue"||c.deadline_status==="critical"?"#dc2626":c.deadline_status==="warning"?"#d97706":"#16a34a"}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text}}>{c.client_name}</div><div style={{fontSize:10,color:C.muted}}>{c.case_number}</div></div>
            <div style={{textAlign:"right",flexShrink:0}}>{badge(STATUS_CONFIG[c.status]?.label||c.status,STATUS_CONFIG[c.status]?.color)}<div style={{fontSize:10,color:C.muted,marginTop:2}}>{fR(c.demand_total)}</div></div>
          </div>
        )):<div style={{padding:30,textAlign:"center",color:C.muted,fontSize:12}}>No cases yet · <span onClick={()=>go("cases-new")} style={{color:"#0B6623",cursor:"pointer"}}>Create first case</span></div>}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:C.shadow}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg}}>
          <span style={{fontWeight:700,color:C.text,fontSize:13}}>📅 Upcoming Hearings</span>
        </div>
        {stats?.upcoming_hearings?.length>0?stats.upcoming_hearings.map((h,i)=>(
          <div key={i} style={{display:"flex",gap:12,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"6px 10px",textAlign:"center",minWidth:44,flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:900,color:"#0B6623",lineHeight:1}}>{new Date(h.hearing_date).getDate()}</div>
              <div style={{fontSize:9,color:"#0B6623",fontWeight:700}}>{new Date(h.hearing_date).toLocaleDateString("en-IN",{month:"short"})}</div>
            </div>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text}}>{h.client_name}</div><div style={{fontSize:10,color:C.muted}}>{h.case_number} · {h.forum||"Court"}</div></div>
          </div>
        )):<div style={{padding:30,textAlign:"center",color:C.muted,fontSize:12}}>No upcoming hearings</div>}
      </div>
    </div>

    {/* Quick actions */}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",boxShadow:C.shadow}}>
      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:14}}>⚡ Quick Actions</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
        {[["👥","Add Client","clients","Add or manage your GST clients"],
          ["📋","New Case","cases-new","Start tracking a new matter"],
          ["⚖️","Draft Appeal","appeals","AI-powered appeal drafting"],
          ["📚","Legal Library","library","Upload references for AI"],
          ["🔍","AI Research","research","Search your legal library"],
          ["💬","AI Chat","chat","Ask legal questions"],
        ].map(([icon,label,key,desc])=>(
          <div key={key} onClick={()=>go(key)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"16px 10px",background:C.bg,borderRadius:8,cursor:"pointer",border:`1px solid ${C.border}`,textAlign:"center",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.borderColor="#0B6623";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="";}}>
            <span style={{fontSize:28}}>{icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:C.text}}>{label}</span>
            <span style={{fontSize:10,color:C.muted,lineHeight:1.4}}>{desc}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Library status + stats */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",boxShadow:C.shadow}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:12}}>📚 Legal Library Status</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:s.total_legal_refs>0?"#f0fdf4":"#fff1f0",border:`3px solid ${s.total_legal_refs>0?"#0B6623":"#dc2626"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:s.total_legal_refs>0?"#0B6623":"#dc2626",flexShrink:0}}>{s.total_legal_refs||0}</div>
          <div><div style={{fontWeight:700,fontSize:14,color:s.total_legal_refs>0?"#0B6623":"#dc2626"}}>{s.total_legal_refs>0?"References Uploaded":"Library Empty"}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.total_legal_refs>0?"AI will cite from these references":"Upload references to enable AI citations"}</div></div>
        </div>
        <button onClick={()=>go("library")} style={{...S.btn,fontSize:11,padding:"8px 14px",width:"100%"}}>{s.total_legal_refs>0?"Manage Library →":"+ Upload First Reference →"}</button>
      </div>
      {isAdmin&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",boxShadow:C.shadow}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:12}}>👑 Admin Quick View</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["👥","Total Users",s.total_users||"—"],["📋","Total Cases",s.total_cases||0],["⚖️","Total Appeals",s.total_appeals||0]].map(([icon,label,val])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}><span style={{color:C.muted}}>{icon} {label}</span><span style={{fontWeight:700,color:C.text}}>{val}</span></div>
          ))}
          <button onClick={()=>go("admin")} style={{...S.btnO,fontSize:11,padding:"8px",width:"100%",marginTop:4}}>Admin Panel →</button>
        </div>
      </div>)}
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT MANAGER
// ══════════════════════════════════════════════════════════════════════════════
function ClientManager({token,toast}){
  const C=getC();const S=getS();
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");const[modal,setModal]=useState(null);
  const[viewing,setViewing]=useState(null);
  const[f,setF]=useState({legal_name:"",trade_name:"",primary_gstin:"",pan:"",constitution_type:"",business_type:"",annual_turnover:"",address:"",city:"",state:"",pincode:"",contact_email:"",contact_phone:"",notes:""});
  const[saving,setSaving]=useState(false);
  const[newGstin,setNewGstin]=useState({gstin:"",state:"",registration_date:""});

  const load=useCallback(()=>{setLoading(true);api(`/clients?search=${encodeURIComponent(search)}`,"GET",null,token).then(d=>{setClients(d.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,search]);
  useEffect(()=>{load();},[load]);

  const openClient=async id=>{try{const d=await api(`/clients/${id}`,"GET",null,token);setViewing(d);}catch(e){toast(e.message,"error");}};
  const save=async()=>{
    if(!f.legal_name)return toast("Legal name required","error");
    setSaving(true);
    try{
      if(modal?.id)await api(`/clients/${modal.id}`,"PUT",f,token);
      else await api("/clients","POST",f,token);
      toast("✅ Client saved","success");setModal(null);load();
    }catch(e){toast(e.message,"error");}setSaving(false);
  };
  const del=async id=>{if(!window.confirm("Delete client?"))return;try{await api(`/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const addGstin=async cid=>{
    if(newGstin.gstin.length!==15)return toast("Enter valid 15-char GSTIN","error");
    try{await api(`/clients/${cid}/gstins`,"POST",newGstin,token);toast("✅ GSTIN added","success");openClient(cid);setNewGstin({gstin:"",state:"",registration_date:""});}
    catch(e){toast(e.message,"error");}
  };
  const initNew=()=>{setF({legal_name:"",trade_name:"",primary_gstin:"",pan:"",constitution_type:"",business_type:"",annual_turnover:"",address:"",city:"",state:"",pincode:"",contact_email:"",contact_phone:"",notes:""});setModal({});};
  const initEdit=c=>{setF({legal_name:c.legal_name||"",trade_name:c.trade_name||"",primary_gstin:c.primary_gstin||"",pan:c.pan||"",constitution_type:c.constitution_type||"",business_type:c.business_type||"",annual_turnover:c.annual_turnover||"",address:c.address||"",city:c.city||"",state:c.state||"",pincode:c.pincode||"",contact_email:c.contact_email||"",contact_phone:c.contact_phone||"",notes:c.notes||""});setModal({id:c.id});};

  if(viewing){const{client:cl,gstins,cases}=viewing;return(<div>
    <button onClick={()=>setViewing(null)} style={{...S.btnO,marginBottom:14,fontSize:12}}>← All Clients</button>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:8}}>{cl.legal_name}</div>
        {cl.trade_name&&<div style={{fontSize:12,color:C.muted,marginBottom:6}}>Trade: {cl.trade_name}</div>}
        <div style={{fontSize:12,color:C.sub,lineHeight:1.8}}>
          GSTIN: <b>{cl.primary_gstin||"—"}</b><br/>
          PAN: {cl.pan||"—"}<br/>
          {cl.constitution_type&&<>{cl.constitution_type} · </>}{cl.business_type||""}<br/>
          {cl.city&&<>{cl.city}, {cl.state} {cl.pincode}<br/></>}
          {cl.contact_phone&&<>📱 {cl.contact_phone}<br/></>}
          {cl.contact_email&&<>✉️ {cl.contact_email}</>}
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>initEdit(cl)} style={{...S.btnO,fontSize:11,padding:"5px 12px"}}>✏️ Edit</button>
          <button onClick={()=>del(cl.id)} style={{...S.btnR,fontSize:11,padding:"5px 12px"}}>🗑 Delete</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>📌 All GSTINs</div>
        {gstins.map(g=><div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
          <span style={{fontWeight:600,fontFamily:"monospace"}}>{g.gstin}</span>
          <span>{g.state||"—"} {badge(g.status,g.status==="active"?"green":"red")}</span>
        </div>)}
        <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
          <input style={{...S.input,flex:1,minWidth:160,fontSize:12}} value={newGstin.gstin} onChange={e=>setNewGstin(p=>({...p,gstin:e.target.value.toUpperCase()}))} placeholder="New GSTIN (15 chars)" maxLength={15}/>
          <input style={{...S.input,width:100,fontSize:12}} value={newGstin.state} onChange={e=>setNewGstin(p=>({...p,state:e.target.value}))} placeholder="State"/>
          <button onClick={()=>addGstin(cl.id)} style={{...S.btn,fontSize:11,padding:"8px 12px"}}>Add</button>
        </div>
      </div>
    </div>
    <div style={S.card}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>📋 Cases ({cases.length})</div>
      {cases.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>No cases for this client</div>:(
        <table style={S.tbl}><thead><tr>{["Case No.","Type","Forum","Status","Demand","Limitation Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{cases.map(c=><tr key={c.id}>
          <td style={{...S.td,fontWeight:600,color:C.green}}>{c.case_number}</td>
          <td style={S.td}>{c.case_type}</td><td style={S.td}>{c.forum||"—"}</td>
          <td style={S.td}>{badge(STATUS_CONFIG[c.status]?.label||c.status,STATUS_CONFIG[c.status]?.color)}</td>
          <td style={S.td}>{fR(c.demand_total)}</td>
          <td style={{...S.td,color:c.limitation_date&&new Date(c.limitation_date)<new Date()?"#c53030":"inherit"}}>{fD(c.limitation_date)}</td>
        </tr>)}</tbody></table>
      )}
    </div>
    {modal&&<Modal title={modal.id?"Edit Client":"New Client"} onClose={()=>setModal(null)} wide>
      {ClientForm(f,setF,save,saving,()=>setModal(null))}
    </Modal>}
  </div>);}

  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search clients..." style={{...S.input,maxWidth:280}}/>
      <button onClick={initNew} style={{...S.btn,marginLeft:"auto"}}>+ New Client</button>
    </div>
    {loading?<Spinner/>:(
      clients.length===0?<div style={{...S.card,textAlign:"center",padding:50}}>
        <div style={{fontSize:48,marginBottom:12}}>👥</div>
        <div style={{fontWeight:700,color:C.text,marginBottom:6}}>No clients yet</div>
        <div style={{color:C.muted,marginBottom:20,fontSize:12}}>Add your first GST litigation client to get started</div>
        <button onClick={initNew} style={S.btn}>+ Add First Client</button>
      </div>:(
        <div style={S.card}>
          <table style={S.tbl}><thead><tr>{["Client Name","GSTIN","City/State","Type","Cases",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{clients.map(c=>(
            <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>openClient(c.id)}>
              <td style={{...S.td,fontWeight:600,color:C.navy}}>{c.legal_name}<br/><span style={{fontSize:10,color:C.muted,fontWeight:400}}>{c.trade_name||""}</span></td>
              <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{c.primary_gstin||"—"}</td>
              <td style={S.td}>{[c.city,c.state].filter(Boolean).join(", ")||"—"}</td>
              <td style={S.td}>{c.constitution_type||"—"}</td>
              <td style={S.td}>{badge(String(c.case_count||0)+" cases","blue")}</td>
              <td style={S.tdR} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>initEdit(c)} style={{...S.btnO,fontSize:10,padding:"3px 8px",marginRight:4}}>Edit</button>
                <button onClick={()=>del(c.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      )
    )}
    {modal&&<Modal title={modal.id?"Edit Client":"New Client"} onClose={()=>setModal(null)} wide>
      {ClientForm(f,setF,save,saving,()=>setModal(null))}
    </Modal>}
  </div>);
}

function ClientForm(f,setF,save,saving,onCancel){
  const C=getC();const S=getS();
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Legal Name *</label><input style={S.input} value={f.legal_name} onChange={e=>set("legal_name",e.target.value)} placeholder="As per GST Registration"/></div>
      <div style={S.fg}><label style={S.label}>Trade Name</label><input style={S.input} value={f.trade_name} onChange={e=>set("trade_name",e.target.value)}/></div>
    </div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Primary GSTIN</label><input style={S.input} value={f.primary_gstin} onChange={e=>set("primary_gstin",e.target.value.toUpperCase())} maxLength={15} placeholder="15-char GSTIN"/></div>
      <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={f.pan} onChange={e=>set("pan",e.target.value.toUpperCase())} maxLength={10}/></div>
    </div>
    <div style={S.col3}>
      <div style={S.fg}><label style={S.label}>Constitution</label><select style={S.select} value={f.constitution_type} onChange={e=>set("constitution_type",e.target.value)}><option value="">Select</option>{["Pvt Ltd","LLP","Partnership","Proprietorship","HUF","Trust","Society"].map(v=><option key={v}>{v}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Business Type</label><select style={S.select} value={f.business_type} onChange={e=>set("business_type",e.target.value)}><option value="">Select</option>{["Manufacturer","Trader","Service","Composition","SEZ","Export","Import-Export"].map(v=><option key={v}>{v}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Annual Turnover</label><select style={S.select} value={f.annual_turnover} onChange={e=>set("annual_turnover",e.target.value)}><option value="">Select</option>{["<1Cr","1-5Cr","5-20Cr","20-100Cr",">100Cr"].map(v=><option key={v}>{v}</option>)}</select></div>
    </div>
    <div style={S.fg}><label style={S.label}>Address</label><input style={S.input} value={f.address} onChange={e=>set("address",e.target.value)}/></div>
    <div style={S.col3}>
      <div style={S.fg}><label style={S.label}>City</label><input style={S.input} value={f.city} onChange={e=>set("city",e.target.value)}/></div>
      <div style={S.fg}><label style={S.label}>State</label><input style={S.input} value={f.state} onChange={e=>set("state",e.target.value)} placeholder="e.g. Uttar Pradesh"/></div>
      <div style={S.fg}><label style={S.label}>Pincode</label><input style={S.input} value={f.pincode} onChange={e=>set("pincode",e.target.value)} maxLength={6}/></div>
    </div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Contact Email</label><input type="email" style={S.input} value={f.contact_email} onChange={e=>set("contact_email",e.target.value)}/></div>
      <div style={S.fg}><label style={S.label}>Contact Phone</label><input style={S.input} value={f.contact_phone} onChange={e=>set("contact_phone",e.target.value)}/></div>
    </div>
    <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,minHeight:60}} value={f.notes} onChange={e=>set("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button onClick={onCancel} style={S.btnO}>Cancel</button>
      <button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving…":"Save Client"}</button>
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// CASE LIST
// ══════════════════════════════════════════════════════════════════════════════
function CaseList({token,toast,go}){
  const C=getC();const S=getS();
  const[cases,setCases]=useState([]);const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState({search:"",status:"",priority:""});
  const[hearingModal,setHearingModal]=useState(null);const[hf,setHf]=useState({hearing_date:"",forum:"",notes:"",outcome:"",next_date:""});

  const load=useCallback(()=>{
    setLoading(true);
    const q=new URLSearchParams();
    if(filter.search)q.set("search",filter.search);
    if(filter.status)q.set("status",filter.status);
    if(filter.priority)q.set("priority",filter.priority);
    api(`/cases?${q}`,"GET",null,token).then(d=>{setCases(d.cases||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,filter]);
  useEffect(()=>{load();},[load]);

  const addHearing=async()=>{
    if(!hf.hearing_date)return toast("Hearing date required","error");
    try{await api(`/cases/${hearingModal}/hearings`,"POST",hf,token);toast("✅ Hearing added","success");setHearingModal(null);load();}
    catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete case and all its data?"))return;try{await api(`/cases/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      <input value={filter.search} onChange={e=>setFilter(p=>({...p,search:e.target.value}))} placeholder="🔍 Search cases..." style={{...S.input,maxWidth:240}}/>
      <select style={{...S.select,width:160}} value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))}>
        <option value="">All Status</option>
        {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
      </select>
      <select style={{...S.select,width:130}} value={filter.priority} onChange={e=>setFilter(p=>({...p,priority:e.target.value}))}>
        <option value="">All Priority</option>
        <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
      </select>
      <button onClick={()=>go("cases-new")} style={{...S.btn,marginLeft:"auto"}}>+ New Case</button>
    </div>
    {loading?<Spinner/>:(
      cases.length===0?<div style={{...S.card,textAlign:"center",padding:50}}>
        <div style={{fontSize:48,marginBottom:12}}>📋</div>
        <div style={{fontWeight:700,color:C.text,marginBottom:6}}>No cases found</div>
        <button onClick={()=>go("cases-new")} style={{...S.btn,marginTop:10}}>+ Create First Case</button>
      </div>:(
        <div style={S.card}>
          <table style={S.tbl}><thead><tr>
            {["Case No.","Client","Forum","Section","Period","Demand","Status","Deadline","Priority",""].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{cases.map(c=>(
            <tr key={c.id}>
              <td style={{...S.td,fontWeight:700,color:C.green,fontSize:11}}>{c.case_number}</td>
              <td style={{...S.td,maxWidth:150}}>
                <div style={{fontWeight:600,fontSize:12}}>{c.client_name}</div>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{c.primary_gstin||"—"}</div>
              </td>
              <td style={{...S.td,fontSize:11}}>{c.forum||"—"}</td>
              <td style={{...S.td,fontSize:11,maxWidth:120}}>{c.section_invoked||"—"}</td>
              <td style={{...S.td,fontSize:11}}>{c.tax_period||"—"}</td>
              <td style={{...S.td,fontWeight:600}}>{fR(c.demand_total)}</td>
              <td style={S.td}>{badge(STATUS_CONFIG[c.status]?.label||c.status,STATUS_CONFIG[c.status]?.color||"gray")}</td>
              <td style={S.td}>
                <div>{fD(c.limitation_date)}</div>
                {c.deadline_status&&c.deadline_status!=="ok"&&badge(DEADLINE_CONFIG[c.deadline_status]?.label,DEADLINE_CONFIG[c.deadline_status]?.color)}
              </td>
              <td style={S.td}>{badge(PRIORITY_CONFIG[c.priority]?.label||c.priority,PRIORITY_CONFIG[c.priority]?.color||"gray")}</td>
              <td style={S.tdR}>
                <button onClick={()=>setHearingModal(c.id)} style={{...S.btnO,fontSize:10,padding:"3px 8px",marginRight:4}}>+Hearing</button>
                <button onClick={()=>del(c.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      )
    )}
    {hearingModal&&(<Modal title="Add Hearing Date" onClose={()=>setHearingModal(null)}>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Hearing Date *</label><input type="date" style={S.input} value={hf.hearing_date} onChange={e=>setHf(p=>({...p,hearing_date:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Forum/Court</label><input style={S.input} value={hf.forum} onChange={e=>setHf(p=>({...p,forum:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Outcome (if past)</label><input style={S.input} value={hf.outcome} onChange={e=>setHf(p=>({...p,outcome:e.target.value}))} placeholder="e.g. Adjourned, Part-heard"/></div>
        <div style={S.fg}><label style={S.label}>Next Date</label><input type="date" style={S.input} value={hf.next_date} onChange={e=>setHf(p=>({...p,next_date:e.target.value}))}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,minHeight:60}} value={hf.notes} onChange={e=>setHf(p=>({...p,notes:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setHearingModal(null)} style={S.btnO}>Cancel</button><button onClick={addHearing} style={S.btn}>Save Hearing</button></div>
    </Modal>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW CASE FORM
// ══════════════════════════════════════════════════════════════════════════════
function CaseForm({token,toast,go,onSaved}){
  const C=getC();const S=getS();
  const[clients,setClients]=useState([]);const[saving,setSaving]=useState(false);
  const[f,setF]=useState({client_id:"",case_type:"appeal",forum:"GST Appellate Tribunal (GSTAT)",order_ref_no:"",order_date:"",order_type:"Order-in-Original (OIO)",section_invoked:"",demand_tax:"",demand_interest:"",demand_penalty:"",tax_period:"",issuing_officer:"",jurisdiction:"",priority:"medium"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  useEffect(()=>{api("/clients","GET",null,token).then(d=>setClients(d.clients||[])).catch(()=>{});},[token]);

  // Limitation date preview
  const limitPreview=()=>{
    if(!f.order_date)return null;
    const d=new Date(f.order_date);d.setMonth(d.getMonth()+3);
    const days=Math.round((d-new Date())/(1000*60*60*24));
    return{date:d.toLocaleDateString("en-IN"),days};
  };
  const lim=limitPreview();

  const save=async()=>{
    if(!f.client_id)return toast("Select a client","error");
    if(!f.case_type)return toast("Case type required","error");
    setSaving(true);
    try{const d=await api("/cases","POST",f,token);toast("✅ Case created — No. "+d.case.case_number,"success");onSaved&&onSaved();go("cases");}
    catch(e){toast(e.message,"error");}setSaving(false);
  };

  return(<div>
    <div style={{...S.card,borderLeft:`3px solid ${C.green}`,marginBottom:14}}>
      <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>📋 New Case / Matter</div>
      <div style={{fontSize:12,color:C.muted}}>A unique case number will be auto-generated. Limitation date is auto-calculated from the order date.</div>
    </div>
    <div style={S.card}>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Client *</label>
          <select style={S.select} value={f.client_id} onChange={e=>set("client_id",e.target.value)}>
            <option value="">— Select Client —</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.legal_name} ({c.primary_gstin||"No GSTIN"})</option>)}
          </select>
          {clients.length===0&&<div style={{fontSize:11,color:"#c53030",marginTop:4}}>No clients found. <span onClick={()=>go("clients")} style={{textDecoration:"underline",cursor:"pointer"}}>Add a client first</span></div>}
        </div>
        <div style={S.fg}><label style={S.label}>Case Type *</label>
          <select style={S.select} value={f.case_type} onChange={e=>set("case_type",e.target.value)}>
            {[["appeal","Appeal"],["reply","Reply to Notice"],["audit","Audit Matter"],["refund","Refund Matter"],["other","Other"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Forum / Authority</label>
          <select style={S.select} value={f.forum} onChange={e=>set("forum",e.target.value)}>
            {["GST Appellate Tribunal (GSTAT)","Commissioner (Appeals)","Additional Commissioner (Appeals)","High Court","Supreme Court","Adjudicating Authority","Other"].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div style={S.fg}><label style={S.label}>Order / Notice Type</label>
          <select style={S.select} value={f.order_type} onChange={e=>set("order_type",e.target.value)}>
            {["Order-in-Original (OIO)","Show Cause Notice (SCN)","DRC-07 (Summary Demand)","ASMT-13 (Best Judgement)","ADT-04 (Audit Report)","REG-19 (Cancellation)","Other"].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Order / Reference No.</label><input style={S.input} value={f.order_ref_no} onChange={e=>set("order_ref_no",e.target.value)} placeholder="e.g. ZA0701240023456"/></div>
        <div style={S.fg}><label style={S.label}>Order Date</label><input type="date" style={S.input} value={f.order_date} onChange={e=>set("order_date",e.target.value)}/></div>
      </div>
      {lim&&<div style={{...S.card,background:lim.days<7?"#fff1f0":lim.days<30?"#fffbeb":"#f0fdf4",border:`1px solid ${lim.days<7?"#feb2b2":lim.days<30?"#fcd34d":"#86efac"}`,padding:10,marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:600}}>⚠️ Limitation Date: {lim.date} ({lim.days>0?`${lim.days} days remaining`:"OVERDUE"})</span>
      </div>}
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Section(s) Invoked</label><input style={S.input} value={f.section_invoked} onChange={e=>set("section_invoked",e.target.value)} placeholder="e.g. Section 73, Section 16(4)"/></div>
        <div style={S.fg}><label style={S.label}>Tax Period</label><input style={S.input} value={f.tax_period} onChange={e=>set("tax_period",e.target.value)} placeholder="e.g. FY 2021-22"/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Tax Demand (₹)</label><input type="number" style={S.input} value={f.demand_tax} onChange={e=>set("demand_tax",e.target.value)} placeholder="0"/></div>
        <div style={S.fg}><label style={S.label}>Interest (₹)</label><input type="number" style={S.input} value={f.demand_interest} onChange={e=>set("demand_interest",e.target.value)} placeholder="0"/></div>
        <div style={S.fg}><label style={S.label}>Penalty (₹)</label><input type="number" style={S.input} value={f.demand_penalty} onChange={e=>set("demand_penalty",e.target.value)} placeholder="0"/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Issuing Officer</label><input style={S.input} value={f.issuing_officer} onChange={e=>set("issuing_officer",e.target.value)} placeholder="e.g. Asst. Commissioner, Agra"/></div>
        <div style={S.fg}><label style={S.label}>Priority</label>
          <select style={S.select} value={f.priority} onChange={e=>set("priority",e.target.value)}>
            <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
          </select>
        </div>
      </div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button onClick={()=>go("cases")} style={S.btnO}>← Back</button>
      <button onClick={save} disabled={saving} style={S.btn}>{saving?"Creating…":"Create Case →"}</button>
    </div>
  </div>);
}

// ── GSTAT Procedure Rules 2025 — Bulk Import Data ──
const GSTAT_RULES_2025_ENTRIES=[
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "G.S.R. 256(E) dated 24-Apr-2025",
    "title": "GSTAT (Procedure) Rules 2025 — Complete Text (All 15 Chapters)",
    "full_text": "MINISTRY OF FINANCE\n(Department of Revenue)\nNOTIFICATION\nNew Delhi, the 24th April, 2025\nG.S.R. 256(E).—In exercise of the powers conferred by section 111 of the Central\nGoods and Services Tax Act, 2017 (12 of 2017), the Goods and Services Tax Appellate\nTribunal hereby makes the following rules for regulating the procedure and functioning of\nthe Goods and Services Tax Appellate Tribunal, namely:-\nCHAPTER I\nPreliminary\n1. Short title and commencement.- (1) These rules may be called the Goods and\nServices Tax Appellate Tribunal (Procedure) Rules, 2025.\n(2) These rules shall come into force on the date of their publication in the Official Gazette.\n2. Definitions.- (1) In these rules, unless the context otherwise requires-\n(a) \"Act\" means the Central Goods and Services Tax Act, 2017 or the\nState Goods and Service Tax Act, 2017 of the concerned State or the\nUnion territory Goods and Services Tax Act, 2017;\n(b) ―adjudicating authority‖ means the adjudicating authority as defined\nunder section sub-section (4) of section 2 of the said Act;\n(c) \"Appellate Tribunal\" means the Goods and Services Tax Appellate\nTribunal established under section 109 of the Act;\n(d) ―authorised representative‖ in relation to any proceedings before the\nAppellate Tribunal means, —\n(i) a person duly appointed by the Central Government or by the\nconcerned State Governments or by an officer duly authorised\nin this behalf as authorised representative to appear, plead and\nact for the Commissioner in such proceedings; or\n(ii) ―a person authorised in writing or through a vakalatnama, duly\nstamped, by a party to present his case before the Appellate\nTribunal as provided under section 116 of the Act, to appear,\nplead or act on his behalf in such proceedings;\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 33\n(e) ―Bench‖ means the Bench of the Appellate Tribunal referred to in\nsection 109 of the CGST Act;\n(f) ―certified copy‖ means the original copy of the order or the documents\nreceived by the party, or a copy thereof duly authenticated by the\nconcerned department, or a copy duly authenticated by the ‗authorised\nrepresentative‘ of the appellant or respondent;\n(g) ―CGST‖ means the Central Goods and Services Tax;\n(h) ―form‖ means a form prescribed under the rules;\n(i) ―GSTAT Portal‖ means web portal as may be specified by an order by\nthe President for functioning of the Appellate tribunal;\n(j) ―Interlocutory application‖ means an application to the Appellate\nTribunal in any appeal or proceeding already instituted in such\nAppellate Tribunal, other than a proceeding for execution of an order;\n(k) ―Member‖ means a member of the Appellate Tribunal and includes the\nPresident and Vice-President;\n(l) ―party‖ means a person who prefers an appeal or an application before\nthe Appellate Tribunal and includes respondent;\n(m) ―specified‖ means as specified by or under these rules;\n(n) \"President\" means the President of the Appellate Tribunal as per\nsection 109 of the CGST Act;\n(o) ―Principal Bench‖ means the Principal Bench constituted in\naccordance with sub-section 3 of section 109 of the CGST Act;\n(p) \"Rules\" means the Central Goods and Service Tax Rules,2017\n(hereinafter referred as the CGST Rules) or Goods and Service Tax\nRules,2017 of the concerned State (hereinafter referred as the SGST\nRules) or Union territory Goods and Service Tax Rules,2017\n(hereinafter referred as the UTGST Rules);\n(q) \"Section\" means a section of the Act;\n\n(r) ―SGST‖ means the State Goods and Services Tax;\n(s) ―State Bench‖ means the State Bench constituted in accordance with\nsub-section 4 of section 109 of the CGST Act;\n(t) ―UTGST‖ means the Union territory Goods and Services Tax;\n(u) ―Vice-President‖ means a Vice-President of the State Benches as per\nsub-section 7 of section 109 of the CGST Act;\n(2) All other words and expressions used in these rules but not defined herein and defined in\nthe Act and the Rules shall have the meanings respectively assigned to them in the Act\nand in the Rules.\nCHAPTER II\nPowers and Functions\n3. Computation of time period. – Where a period is prescribed by the Act or the Rules or\nthese rules or under any other law or is fixed by the Appellate Tribunal for doing any act, in\ncomputing the time, the day from which the said period is to be reckoned shall be excluded,\nand if the last day expires on a day when the office of the Appellate Tribunal is closed, that\nday and any succeeding day or days on which the Appellate Tribunal remains closed shall\nalso be excluded.\n4. Format of order or direction or ruling. – Every ruling, direction, order, summons,\nwarrant or other mandatory process shall be issued by the Appellate Tribunal in the name of\nthe President or the Member and shall be signed by the Registrar or any other officer\nspecifically authorised in that behalf by the President, with the day, month and year of\nsigning and shall be sealed with the official seal of the Appellate Tribunal, where physical\ncopy of such ruling, direction, order, summons, warrant or other mandatory process is issued.\n5. Official seal of the Appellate Tribunal. – The official seal and emblem of the Appellate\nTribunal shall be such, as the President may from time to time specify and shall be in the\ncustody of the Registrar.\n6. Custody of the records. –The Registrar shall have the custody of the records of the\nAppellate Tribunal and no record or document filed in any case or matter shall be allowed to\nbe taken out of the custody of the Appellate Tribunal without the leave of the Appellate\nTribunal:\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 35\nProvided that the Registrar may allow any other officer of the Appellate Tribunal to\nremove any official paper or record for administrative purposes from the Appellate Tribunal.\n7. Sittings of Bench. – A bench shall hold its sittings at the locations as notified by the\nCentral Government.\n8. Sitting hours of the Appellate Tribunal. – The sitting hours of the Appellate Tribunal\nshall ordinarily be from 10.30 a.m. to 01.30 p.m. and from 2.30 p.m. to 4.30 p.m. subject to\nany order made by the President and this shall not prevent the Appellate Tribunal to extend\nits sitting as it deems fit.\n9. Working hours of office. –The administrative offices of the Appellate Tribunal shall\nremain open on all working days from 9:30 am to 6.00 pm, subject to any order made by the\nPresident.\n10. Inherent powers. – Nothing in these rules shall be deemed to limit or otherwise affect\nthe inherent powers of the Appellate Tribunal to make such orders or give such directions as\nmay be necessary for meeting the ends of justice or to prevent abuse of the process of the\nAppellate Tribunal.\n11. Calendar. – The calendar of days of working of Appellate Tribunal in a year shall be as\ndecided by the President and Members of the Appellate Tribunal.\n12. Listing of cases. – Any urgent matter filed before 12:00 noon shall be listed before the\nAppellate Tribunal on the following working day, if it is complete in all respects as provided\nin these rules and in exceptional cases, it may be received after 12:00 noon but before 3:00\np.m. for listing on the following day, with the specific permission of the Appellate Tribunal\nor President.\n13. Power to exempt. – The Appellate Tribunal may on sufficient cause being shown,\nexempt the parties from compliance with any requirement of these rules and may give such\ndirections in matters of practice and procedure, as it may consider just and expedient on the\napplication moved in this behalf to render substantial justice.\n14. Power to extend time. – The Appellate Tribunal may extend the time appointed by these\nrules or fixed by any order, for doing any act or taking any proceeding, upon such terms, if\nany, as the justice of the case may require, and any extension may be ordered, although the\napplication for the same is not made until the expiration of the time appointed or allowed.\n15. Powers and functions of the Registrar. – The Registrar shall have the following powers\nand functions, namely: -\n(a) shall be responsible for the day-to-day administration of the Appellate\nTribunal;\n(b) notify the procedure of filing appeal to the Appellate Tribunal;\n\n(c) registration of appeals, petitions and applications and scrutiny thereof;\n(d) receive applications for amendment of appeal or the petition or application or\nsubsequent proceedings;\n(e) receive applications for fresh summons or notices and regarding services\nthereof;\n(f) receive applications for short date summons and notices;\n(g) receive applications for substituted service of summons or notices;\n(h) receive applications for seeking orders concerning the admission and\ninspection of documents;\n(i) maintain records of proceedings and manage the registry; and\n(j) such other incidental matters as the President may direct from time to time.\n16. Power of adjournment. – All adjournments shall normally be sought before the\nconcerned Bench and in extraordinary circumstances, the Registrar may, if so directed by the\nAppellate Tribunal in chambers, at any time adjourn any matter and lay the same before the\nAppellate Tribunal in chambers.\n17. Delegation powers of the President. – (1) The President may assign or delegate to the\nVice-president of State Bench some of the functions required by these rules to be exercised\nby the President.\n(2) The President may assign or delegate to a Joint Registrar or Deputy Registrar or Assistant\nRegistrar or to any other suitable officer all or some of the functions required by these rules\nto be exercised by the Registrar.\nCHAPTER III\nInstitution of appeals - Procedure\n18. Filing of appeals. – (1) An appeal to the Appellate Tribunal shall be filed online on\nGSTAT Portal in Form prescribed under the Rules, and shall contain the following details,\nnamely :-\n(a) the cause title shall state ―In the Goods and Service Tax Appellate\nTribunal‖ and also set out the proceedings or order of the authority\nagainst which it is preferred;\n(b) appeal shall be divided into paragraphs and shall be numbered\nconsecutively, and each paragraph shall contain as nearly as may be, a\nseparate fact or allegation or point;\n(c) full name, parentage, Goods and Services Tax Identification Number,\ndescription of each party and address, as applicable, shall also be set\nout at the beginning of the appeal and need not be repeated in the\nsubsequent proceedings in the same appeal; and\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 37\n(d) the names of parties shall be numbered consecutively and a separate\nline should be allotted to the name and description of each party and\nthese numbers shall not be changed and in the event of the death of a\nparty during the pendency of the appeal, his legal heirs or\nrepresentative, as the case may be, if more than one, shall be shown by\nsub-numbers.\n(2) Notwithstanding the number of show cause notices, refund claims or demands, letters\nor declarations dealt with in the decision or order appealed against, it shall suffice for\npurposes of these rules that the appellant files one appeal in prescribed Form against the order\nor decision of the appellate authority, along with such number of copies thereof as provided\nin sub-rule 21.\n(3) In a case where the –\n(a) impugned order-in-appeal has been passed with reference to more than one\norders-in-original, the prescribed Form for appeal filed as per the Rules shall be as\nmany as the number of the orders-in-original to which the case relates in so far as the\nappellant is concerned;\n(b) In case an impugned order is in respect of more than one person, each\naggrieved person will be required to file a separate appeal, and common appeals or\njoint appeals shall not be entertained.\n19. Date of presentation of appeals. -- The Registrar or, as the case may be, the officer\nauthorised by him, shall endorse on every Form of appeal the date on which it is presented or\ndeemed to have been presented under that rule and shall sign the endorsement, if the appeal is\nfiled manually.\n20. Contents of an appeal Form. – (1) Every Form of appeal shall set forth concisely and\nunder distinct heads, the grounds of appeal and such grounds shall be numbered\nconsecutively and shall be typed in double space of the paper.\n(2) Every Form of appeal, cross-objections, reference applications, stay applications or any\nother miscellaneous applications shall also be typed neatly in double spacing on the A4 size\npaper and the same shall be duly paged, indexed and tagged firmly with Form of appeal in a\nseparate folder.\n(3) Every Form of appeal or application or cross-objection shall be signed and verified by the\nappellant or applicant or respondent or the authorised representative. The appellant or\napplicant or respondent or the authorised representative shall certify as true copy the\ndocuments produced before the Appellate Tribunal.\n21. Documents required to accompany Form of appeal. – (1) Every Form of appeal\nrequired to be heard by the Appellate Tribunal shall be accompanied by a certified copy of\nthe order appealed against in the case of an appeal against the original order passed by the\nadjudicating authority and where such an order has been passed in appeal or revision, there\nshall be a certified copy of the order passed in appeal or in revision along with the order of\nthe original authority along with all the relevant documents including relied upon documents:\n\nProvided that where an application filed under the direction of the Commissioner, the\ncopy of the order appealed against shall be an attested copy instead of a certified copy.\n(2) A certified copy of the decision or order appealed against along with fees as specified in\nsub-rule 5 of rule 110 of the Rules shall be submitted online and a final acknowledgement,\nshall be issued the Rules, by the GSTAT Portal.\n(3) The President may further direct that in case of non-filing of the documents as specified\nunder this Rule, the Registrar or any other authorised officer would be competent to return\nthe specified documents or sets of documents and to receive the same back only after\nrectification of the defects to the satisfaction of the Registrar or any other authorised officer\nor the Bench as the case may be and on the return the case may be assigned a new number.\n(4) The Appellate Tribunal may on its own motion direct the preparation of as many copies as\nmay be required of all the relevant documents including relied upon documents by and at the\ncost of the appellant or the respondent, containing copies of such statements, papers or\ndocuments as it may consider necessary for the proper disposal of the appeal;\n(5) President may by a general or special order allow attestation of the documents filed along\nwith appeal or application or as a part of relevant documents including relied upon documents\nor otherwise by a gazetted officer or such other person as may be authorised by the President\nto attest or certify such documents or photo copies thereof; and\n(6) All relevant documents including relied upon documents shall be clearly legible, duly\npaged, indexed and tagged firmly.\n22. Endorsement and verification. - At the foot of every appeal or pleading along with all\nthe relevant documents including relied upon documents, there shall appear the name and\nsignature of the authorised representative and every appeal or pleadings shall be signed and\nverified by the party concerned in the manner provided by these rules.\n23. Translation of documents. – (1) A document other than English language intended to be\nused in any proceeding before the Appellate Tribunal shall be received by the Registry\naccompanied by a translated copy in English, which is agreed to by both the parties or\ncertified to be a true translated copy by the authorised representative engaged on behalf of\nparties in the case;\n(2) Appeal or other proceeding shall not be set down for hearing until and unless all parties\nconfirm that all the documents filed on which they intend to rely are in English or have been\ntranslated into English and required number of copies are filed with the Appellate Tribunal.\n24. Endorsement and scrutiny of petition or appeal or document. – (1) If, on scrutiny, the\nappeal, application or any other document is found to be defective, such document shall, after\nnotice to the party, be returned for compliance and if there is a failure to comply within seven\nworking days from the date of return, the same shall be placed before the Registrar who may\npass appropriate orders.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 39\n(2) The Registrar may for sufficient cause return the said documents for rectification or\namendment to the party filing the same, and for this purpose may allow to the party\nconcerned such reasonable time as he may consider necessary or extend the time for\ncompliance, in any case not exceeding thirty days from the date of filing of the said\ndocuments.\n(3) Where the party fails to take any step for the removal of the defect within the time fixed\nfor the same, the Registrar may, for reasons to be recorded in writing, decline to register the\nappeal or pleading or document.\n(4) Where, after a personal hearing, the Registrar is not satisfied with the steps taken by the\nparty for removal of defects, he shall list the same with defects for hearing before the\nappropriate bench of the Tribunal and the Bench may, after hearing the party, accept to\nregister the appeal or may, in its discretion, reject the said appeal.\n25. Registration of admitted appeals. - On admission of appeal, the same shall be numbered\nand registered in the appropriate register maintained in this behalf and its number shall be\nentered therein (Index to be modified accordingly).\n26. Ex-parte amendments. - In every appeal or application, arithmetical, grammatical,\nclerical and such other errors may be rectified on the orders of the Registrar without notice to\nParties:\nProvided that no amendments shall be allowed ex-parte after appearance of the\nrespondents.\n27. Calling for records. On the admission of appeal, the Registrar shall, if so directed by the\nAppellate Tribunal, call for the records relating to the proceedings from the respective Bench\nof Appellate Tribunal or adjudicating authority and retransmit the same at the conclusion of\nthe proceedings or at any time.\n28. Production of authorization for and on behalf of an applicant or respondent or\nparty.- Where an appeal is purported to be instituted by or on behalf of an applicant or\nrespondent or party, the person who signs or verifies the same shall produce along with such\nappeal, for verification by the Registrar, a true copy of authorization letter empowering such\nperson to do so:\nProvided that the Registrar may at any time call upon the party to produce such\nfurther materials as he deems fit for satisfying himself about due authorisation.\n29. Interlocutory applications.– Every interlocutory application for stay, direction,\nrectification in order, condonation of delay, early hearing, exemption from production of\ncopy of order appealed against or extension of time prayed for in pending matters shall\ninclude all the information as per the prescribed GSTAT FORM-01 and the requirements\nprescribed in that behalf shall be complied with by the applicant, besides filing an affidavit\nsupporting the application.\n\n30. Procedure on production of defaced, torn or damaged documents.- When a document\nproduced along with any pleading appears to be defaced, torn, or in any way damaged or\notherwise its condition or appearance requires special notice, a mention regarding its\ncondition and appearance shall be made by the party producing the same in the Index of such\na pleading and the same shall be verified and initialed by the officer authorised to receive the\nsame.\n31. Grounds which may be taken in appeal.- The appellant shall not, except by leave of the\nAppellate Tribunal, urge or be heard in support of any grounds not set forth in the Form of\nappeal, but the Appellate Tribunal, in deciding the appeal, shall not be confined to the\ngrounds set forth in the Form of appeal or those taken by leave of the Appellate Tribunal\nunder these rules:\nProvided that the Appellate Tribunal shall not rest its decision on any other grounds\nunless the party who may be affected thereby has had a sufficient opportunity of being heard\non that ground.\n32. Rejection or amendment of Form of appeal. — (1) The Registrar may, in its\ndiscretion, on sufficient cause being shown, accept a Form of Appeal which is not\naccompanied by the documents referred to in rule 21 or is in any other way defective, and in\nsuch cases may require the appellant to file such documents or as the case may be, make\nnecessary amendments within such time as it may allow, which may in any case not exceed\nthirty days.\n(2) The Registrar may reject the Form of Appeal, if the documents referred to therein are not\nproduced, or the amendments are not made, within the time-limit allowed.\n(3) The President may in his discretion authorise any officer of the Appellate Tribunal to.\n(a) return any Form of appeal, application or documents filed manually and which\nis/are not in accordance with these Rules; and\n(b) allow the documents to be refiled after removal of the defects in the specified\ntime.\n(5) On representation, the Bench concerned may in its discretion either accept the Form of\nAppeal in terms of above rules but the appeal or application may not be restored to its\noriginal number unless the Bench allows it to be so restored on sufficient cause being shown.\n33. Who may be joined as respondents. — (1) In an appeal or an application filed by a\nperson other than the [Commissioner], the [Commissioner] concerned shall be made the\nrespondent to the appeal or the application, as the case may be.\n(2) In an appeal or an application by the [Commissioner], the other party shall be made the\nrespondent to the appeal.\n34. Endorsing copies to the party. — A copy each of appeal and relevant documents along\nwith relied upon documents shall be provided to the respondent as well as to the concerned\nCommissioner, as the case may be, as soon as they are filed.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 41\n35. Filing of Form of cross-objections, applications or replies to appeals or applications.\n— Every Form of cross-objections filed as prescribed under CGST or SGST or UTGST\nRules 2017, and every application made, under the provisions of the Act, shall be registered\nand numbered, and the provisions of these rules, relating to appeals shall, so far as may be,\napply to such form or application.\n36. Filing of reply and other documents by the respondents. – (1) Each respondent may\nfile his reply to the petition or the application and copies of the documents, either in person or\nthrough an authorised representative, with the registrar as specified by the Appellate Tribunal\nwithin one month of the receipt thereof. A copy of such reply and the copies of other\ndocuments shall be forthwith served on the applicant by the respondent.\n(2) On being served the reply or documents under sub-rule (1), the applicant shall specifically\nadmit, deny, or rebut the facts stated by the respondent in his submission and state such\nadditional facts as may be found necessary.\n37. Filing of rejoinder. – Where the respondent states such additional facts as may be\nnecessary for the just decision of the case, the Bench may allow the petitioner to file a\nrejoinder to the reply filed by the respondent on GSTAT portal, with an advance copy to be\nserved upon the respondent within one month or within such time as may be specified or\nextended by Bench.\nCHAPTER IV\nCause list\n38. Preparation and publication of daily cause list. - (1) The Registrar shall prepare and\npublish the cause list for the next working day, which shall include all the information as\nspecified in GSTAT CDR-01, on the notice board of the Appellate Tribunal and GSTAT\nPortal before the closing of working hours on each working day.\n(2) Subject to the directions of the President, listing of cases in the daily cause list shall be in\nthe following order of priority, unless otherwise ordered by the concerned Bench, namely: –\n(a) cases for pronouncement of orders;\n(b) cases for clarification;\n(c) cases for admission;\n(d) cases for orders or directions;\n(e) part-heard cases, latest part-heard having precedence; and\n(f) cases posted as per numerical order or as directed by the Bench.\n(3) The Registrar shall communicate to the parties the date and place of hearing of the appeal\nor application.\n(4) The title of the daily cause list shall consist of the number of the appeal, the day, date and\ntime of the sitting Bench Hall number and the coram indicating the names of the Judicial\nmembers and Technical Members constituting the Bench.\n\n(5) Against the number of each case listed in the daily cause list, the following shall be\nshown, namely: –\n(a) names of the legal practitioners or authorised representative appearing for\nboth sides and setting out in brackets the designation of the parties whom\nthey represent;\n(b) names of the parties, if unrepresented, with their ranks in brackets.\n39. New cause list and adjournment of cases on account of non-sitting of an Appellate\nTribunal. – (1) If by reason of declaration of holiday or for any other unforeseen reason, the\nAppellate Tribunal does not function for the day, the new daily cause list shall be prepared\nfor the cases listed for the day.\n(2) When the sitting of a particular Bench is cancelled for the reason of inability of any\nMember of the Bench, the Registrar shall, unless otherwise directed, adjourn the cases posted\nbefore that Bench to a convenient date.\n(3) The adjournment or posting or directions shall be notified on the notice board and on the\nGSTAT Portal.\n40. Service of notices and communication. – (1) Any notice or communication to be issued\nby the Appellate Tribunal may be served by any of the method specified in section 169 of the\nAct.\nExplanation- For the purpose of this rule, the common Portal referred in the said section shall\nmean the GSTAT Portal.\n(2) Notwithstanding anything contained in sub-rule(1) and sub-rule(2), the Appellate\nTribunal may after taking into account the number of respondents and their place of residence\nor work or service are so many that they could not be effected in any manner and other\ncircumstances, direct that notice of the petition or application shall be served upon the\nrespondents in any other manner, including any manner of substituted service, as it appears to\nthe Appellate Tribunal just and convenient.\n(3) A notice or process may also be served on an authorised representative of the applicant or\nthe respondent, as the case may be, in any proceeding or on any person authorised to accept a\nnotice or a process, and such service on the authorised representative shall be deemed to be a\nproper service.\nCHAPTER V\nHearing of Appeal\n41. Hearing of appeal. — (1) On the day fixed, or on any other day to which the hearing\nmay be adjourned, the appellant shall be heard in support of the appeal.\n(2) The Appellate Tribunal shall then, if necessary, hear the respondent against the appeal and\nin such a case the appellant shall be entitled to reply.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 43\n42.Action on appeal for appellant’s default. — Where on the day fixed for the hearing of\nthe appeal or on any other day to which such hearing may be adjourned, the appellant does\nnot appear when the appeal is called on for hearing, the Appellate Tribunal may, in its\ndiscretion, either dismiss the appeal for default or hear and decide it on merits :\nProvided that where an appeal has been dismissed for default and the appellant\nappears afterwards and satisfies the Appellate Tribunal that there was sufficient cause for his\nnon-appearance when the appeal was called on for hearing, the Appellate Tribunal shall make\nan order setting aside the dismissal and restore the appeal.\n43. Hearing of appeals ex parte. — Where on the day fixed for the hearing of the appeal or\non any other day to which the hearing is adjourned the appellant appears and the respondent\ndoes not appear when the appeal is called on for hearing, the Appellate Tribunal may hear\nand decide the appeal ex parte.\n44. Continuance of proceedings after death or adjudication as an insolvent of a\nparty to the appeal. – Where in any proceedings the appellant or a respondent dies or is\nadjudicated as an insolvent or in the case of a company, is being wound up, the appeal or\napplication shall abate, unless an application is made for continuance of such proceedings by\nor against the successor-in-interest, the executor, receiver, liquidator or other legal\nrepresentative of the appellant or respondent, as the case may be:\nProvided that every such application shall be made within a period of sixty days of the\noccurrence of the event:\nProvided further that the Appellate Tribunal may, if it is satisfied that the applicant\nwas prevented by sufficient cause from presenting the application within the period so\nspecified, allow it to be presented within such further period as it may deem fit.\n45. Production of additional evidence. — (1) The parties to the appeal shall not be entitled to\nproduce any additional evidence, either oral or documentary, before the Appellate Tribunal :\nProvided that if the Appellate Tribunal is of opinion that any documents shall be\nproduced or any witness shall be examined or any affidavit shall be filed to enable it to pass\norders or for any sufficient cause, or if adjudicating authority or the appellate or revisional\nauthority has decided the case without giving sufficient opportunity to any party to adduce\nevidence on the points specified by them or not specified by them, the Appellate Tribunal\nmay, for reasons to be recorded, allow such documents to be produced or witnesses to be\nexamined or affidavits to be filed or such evidence to be adduced.\n(2) The production of any document or the examination of any witness or the adducing of any\nevidence under sub-rule (1) may be done either before the Appellate Tribunal or before such\nauthority as the Appellate Tribunal may direct.\n(3) Where any direction has been made by the Appellate Tribunal to produce any documents\nor to examine any witnesses or to adduce any evidence before any authority, the authority\nshall comply with the directions of the Appellate Tribunal and after such compliance send the\n\ndocuments, the record of the deposition of the witnesses or the record of evidence adduced, to\nthe Appellate Tribunal.\n(4) The Appellate Tribunal may, of its own motion, call for any documents or summon any\nwitnesses on points at issue, if it considers necessary to meet the ends of justice.\n46. Production of evidence by Affidavit. – (1) The Appellate Tribunal may direct the parties\nto give evidence, if any, by affidavit.\n(2) Notwithstanding anything contained in sub-rule (1) where the Appellate Tribunal\nconsiders it necessary in the interest of natural justice, it may order cross-examination of any\ndeponent on the points of conflict either through information and communication technology\nfacilities such as video conferencing or otherwise as may be decided by the Appellate\nTribunal, on an application moved by any party.\n47. Adjournment of appeal. — The Appellate Tribunal may, on such terms as deem fit and\nat any stage of the proceedings, adjourn the hearing of the appeal.\n48. Proceedings to be open to public — The proceedings before the Appellate Tribunal\nshall be open to the public:\nProvided that the Appellate Tribunal may, if deem fit, order at any stage of the\nproceedings of any particular case that the public generally or any particular person shall not\nhave access to, or be or remain in the room or building used by the Appellate Tribunal.\n49. Procedure for filing of and disposal of interlocutory application. — The provisions of\nthe rules regarding the filing of interlocutory applications shall, in so far as may be, apply\nmutatis mutandis to the filing of applications under this rule.\n50. Appeal referred to larger Bench. – In case of different opinion of Members of Bench\nwhile hearing an appeal, the appeal shall be referred to larger Bench by the President, as it\ndeems fit, for disposal of the appeal.\n51. Order to be signed and dated. – (1) Every order of the Appellate Tribunal shall be in\nwriting and shall be signed and dated by the Members constituting the Bench concerned.\n(2) Last date of hearing of the matter shall be typed on the first page of the order.\n(3) If the order is dictated on the Bench, the date of dictation will be the date of the final\norder.\n(4) If the order is reserved, the date of final order will be the date on which the order is\npronounced.\n(5) In cases, where gist of the decision is pronounced without the detailed order, the last para\nof the detailed order shall specify the date on which the gist of the decision was pronounced\nand in such cases, the date of the final order shall be the date on which all the Members of the\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 45\nBench sign the order and where the order is signed on different dates by the Members of the\nBench, the last of the dates will be the date of the order.\n52. Publication of orders. — Such of the orders of the Appellate Tribunal as are deemed fit\nfor publication in any authoritative report or the press, may be released for such publication\non such terms and conditions as the Appellate Tribunal may lay down.\nCHAPTER VI\nRECORD OF PROCEEDINGS\n53. Court diary. — (1) Diaries shall be kept by the Court Officer which shall include all the\ninformation as given in form GSTAT CDR-02 as may be specified in each appeal or petition\nor application and they shall be written legibly.\n(2) The diary in the main file shall contain a concise history of the appeal or petition or\napplication, the substance of the order passed thereon and in execution proceedings, it shall\ncontain a complete record of all proceedings in execution of order or direction or rule and\nshall be checked by the Deputy Registrar or Assistant Registrar and initiated once in a\nfortnight.\n54. Order sheet. — (1) The Court officer of the Bench shall maintain order sheet which shall\ninclude all the information as specified in GSTAT FORM-02 in every proceedings shall\ncontain all orders passed by the Appellate Tribunal from time to time.\n(2) All orders passed by the Appellate Tribunal shall be in English and the same shall be\nsigned by the Members of the Appellate Tribunal constituting the Bench:\nProvided that the routine orders, such as call for of the records, put up with records,\nadjournment and any other order as may be directed by the Member of the Tribunal shall be\nsigned by the Court officer of the Bench.\n(3) The order sheet shall also contain the reference number of the appeal or petition or\napplication, date of order and all incidental details including short cause title thereof.\n55. Maintenance of court diary. — (1) The Court officer of the Bench shall maintain on\nGSTAT portal a court diary, wherein he shall record the proceedings of the court for each\nsitting with respect to the applications or petitions or appeals listed in the daily cause list.\n(2) The matters to be recorded in the court diary shall include details as to whether the case is\nadjourned or partly heard or heard and disposed of or heard and orders reserved, as the case\nmay be, along with dates of next sitting wherever applicable.\n56. Statutes or citations for reference. —The parties or authorised representative or legal\npractitioners shall, before the commencement of the proceedings for the day, furnish to the\nCourt officer a list of law journals, reports, statutes and other citations, which may be needed\nfor reference or photocopy of full text thereof.\n\n57. Calling of cases in court. —Subject to the orders of the Bench, the Court officer shall\ncall the cases listed in the cause list in the serial order.\n58. Regulation of court work. — (1) When the Appellate Tribunal is holding a sitting, -\n(a) the Deputy Registrar or Assistant Registrar shall ensure that no inconvenience or wastage\nof time is caused to the Bench in making available the services of Court officer or\nstenographer or peon or attender; and\n(b) the Court officer shall ensure that perfect silence is maintained in and around the Court\nHall and no disturbance whatsoever is caused to the functioning of the Bench and that proper\ncare is taken to maintain dignity and decorum of the court.\n(2) When the Bench passes order or issues directions, the Court officer shall ensure that the\nrecords of the case along with proceedings or orders of the Bench are transmitted\nimmediately to the Deputy Registrar or Assistant Registrar and the Deputy Registrar or\nAssistant Registrar shall verify the case records received from the Court Officer with\nreference to the cause list and take immediate steps to communicate the directions or orders\nof the Bench.\nCHAPTER VII:\nMAINTENANCE OF REGISTERS\n59. Registers to be maintained. —The following Registers shall be maintained\nonline/offline and posted on a day-to-day basis by such ministerial officer or officer of the\nRegistry may, subject to any order of the President –\n(a) register of un-numbered petitions or appeals (GSTAT-CDR-03);\n(b) register of petitions or appeals (GSTAT-CDR -04); and\n(c) register of interlocutory applications (GSTAT-CDR -05).\n60. Arrangement of records in pending matters. —The record of appeal or petition shall\nbe divided into the following four parts and shall be collated and maintained –\n(a) main file: (Petition being kept separately);\n(b) miscellaneous application file;\n(c) process file; and\n(d) execution file.\n61. Contents of main file. —The main file shall be kept in the following order and it shall be\nmaintained as permanent record till ordered to be destroyed under the rules –\n(a) index;\n(b) order sheet;\n(c) final order or judgment;\n(d) Form of appeal or petition, as the case may be, together with any schedule\nannexed thereto;\n(e) counter or reply or objection, if any;\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 47\n(f) oral evidence or proof of affidavit;\n(g) evidence taken on commission;\n(h) documentary evidence; and\n(i) written arguments.\n62. Contents of process file. —The process file shall contain the following items, namely –\n(a) index;\n(b) power of attorney or vakalatnama;\n(c) summons and other processes and affidavits relating thereof;\n(d) applications for summoning witness;\n(e) letters calling records; and\n(f) all other miscellaneous papers such as postal acknowledgements.\n63. Contents of execution file. —The execution file shall contain the following items,\nnamely-\n(a) index;\n(b) the order sheet;\n(c) the execution application;\n(d) all processes and other papers connected with such execution proceedings;\n(e) transmission of order to civil court, if ordered; and\n(f) result of execution.\n64. File for miscellaneous applications. — For all miscellaneous applications there may be\nonly one file with a title page prefixed to it and immediately after the title page, the diary, the\nmiscellaneous applications, supporting affidavit, the order sheet and all other documents shall\nbe filed.\n65. Preservation of Record. — (1) All necessary documents and records relating to\npetitions or applications dealt with by the Appellate Tribunal shall be stored or maintained as\nprovided in these rules and other physical records kept in a record room shall be preserved for\na period of five years after the passing of the final order.\n(2) Notwithstanding anything contained in sub-rule (1), the record of the petitions or\napplications dealt with by the Appellate Tribunal, including the orders and directions passed\nby the Appellate Tribunal, shall be maintained by the Registry of the Appellate Tribunal for a\nperiod of fifteen years after the passing of the final order.\n66. Retention, Preservation and Destruction of records. — (1) The record keeper or any\nother officer so designated shall be responsible for the records consigned to the record room.\nHe shall scrutinise the records received by him within three days and prepare an index in\nprescribed format.\n(2) On the expiry of the period for preservation of the records specified under rule 65, the\nRegistrar shall weed out the record.\n\nCHAPTER VIII\nINSPECTION OF RECORD\n67. Inspection of the records. - The applicant to any case or their authorised representative\nmay be allowed to inspect the record of the case by making an application in writing in\nprescribed GSTAT-FORM-03 to the Registrar and by paying the fee prescribed as per\nSchedule of Fee.\n68. Grant of inspection. - Inspection of records of a pending or decided case before the\nAppellate Tribunal shall be allowed only on the order of the Registrar.\n69. Application for grant of inspection. - (1) Application for inspection of record under rule\n67, shall be presented at Registry between 10.30 a.m. to 01:30 p.m. on any working day and\ntwo days before the date on which inspection is sought, unless otherwise permitted by the\nRegistrar.\n(2) The Registry shall submit the application with its remarks before the Registrar, who shall,\non consideration of the same, pass appropriate orders.\n(3) Inspection of records of a pending case shall not ordinarily be permitted on the date fixed\nfor hearing of the case or on the preceding day.\n70. Mode of inspection. - (1) On grant of permission for inspection of the records, the\nDeputy Registrar or Assistant Registrar shall arrange to procure the records of the case and\nallow inspection of such records on the date and time fixed by the Registrar between 10.30\na.m. and 12.30 p.m. and between 2.30 p.m. and 4.30 p.m. in the immediate presence of an\nofficer authorised in that behalf by the Registrar.\n(2) The person inspecting the records shall not in any manner cause dislocation, mutilation,\ntampering or damage to the records in the course of inspection.\n(3) The person inspecting the records shall not make any marking on any record or paper so\ninspected and taking notes.\n(4) The person supervising the inspection, may at any time prohibit further inspection, if in\nhis opinion, any of the records are likely to be damaged in the process of inspection or the\nperson inspecting the records has violated or attempted to violate the provisions of these rules\nand shall immediately make a report about the matter to the Registrar and seek further orders\nfrom the Registrar and such notes shall be made in the Inspection Register.\n71. Maintenance of register of inspection. - The Deputy Registrar or Assistant Registrar\nshall cause to maintain a Register as per GSTAT-CDR -06 for the purpose of inspection of\ndocuments or records and shall obtain therein the signature of the person making such\ninspection on the Register as well as on the application on the conclusion of inspection.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 49\nCHAPTER IX:\nAppearance of authorised representative\n72. Appearance of authorised representative. – Subject to as hereinafter provided, no legal\npractitioner or authorised representative shall be entitled to appear and act, in any proceeding\nbefore the Appellate Tribunal unless he files into Appellate Tribunal vakalatnama or\nMemorandum of Appearance or letter of authorisation which shall include all the information\nas specified in GSTAT FORM-04 as the case may, duly executed by or on behalf of the party\nfor whom he appears.\n73. Consent for engaging or change of authorised representative (Duly stamped as per\nthe respective High Court rules). – A legal practitioner or authorised representative\nproposing to file a Vakalatnama or Memorandum of Appearance or letter of authorisation, as\nthe case may be, in any pending case or proceeding before the Appellate Tribunal in which\nthere is already a legal practitioner or authorised representative on record, shall do so only\nwith the written consent of the legal practitioner or the authorised representative on record or\nwhen such consent is refused, with the permission of the Appellate Tribunal after revocation\nof Vakalatnama or Memorandum of Appearance, as the case may be, on an application filed\nin this behalf, which shall receive consideration only after service of such application on the\ncounsel already on record:\nProvided that such consent shall not be required in case of application filed under sub-\nsection 3 of section 112 of the Act.\n74. Restrictions on appearance. – A legal practitioner or the authorised representative, as\nthe case may be, who has tendered advice in connection with the institution of any case or\nother proceeding before the Appellate Tribunal or has drawn pleadings in connection with\nany such matter or has during the progress of any such matter acted for a party, shall not,\nappear in such case or proceeding or other matter arising there from or in any matter\nconnected therewith for any person whose interest is opposed to that of his former client,\nexcept with the prior permission of the Appellate Tribunal.\n75. Restriction on party’s right to be heard. – The party who has engaged a legal\npractitioner or authorised representative to appear for him before the Appellate Tribunal may\nbe restricted by the Appellate Tribunal in making presentation before it.\n76. Empanelment of special authorised representatives by the Appellate Tribunal. – (1)\nThe Appellate Tribunal may draw up a panel of authorised representatives or valuers or such\nother experts as may be required by the Appellate Tribunal to assist in proceedings before the\nAppellate Tribunal.\n(2) The Appellate Tribunal may call upon any of the persons from panel under sub-rule (1)\nfor assistance in the proceedings before the Bench, if so required.\n(3) The remuneration payable and other allowances and compensation admissible to such\npersons shall be specified in consultation with the Appellate Tribunal.\n\n77. Professional dress for the authorised representatives. – While appearing before the\nAppellate Tribunal, the authorised representatives shall wear the same professional dress as\nprescribed in their Code of Conduct.\nCHAPTER X\nAFFIDAVITS\n78. Title of affidavits. - Every affidavit shall be titled as ‗Before the Goods and Services\nTax Appellate Tribunal (GSTAT)‘ followed by the cause title of the appeal or application or\nother proceeding in which the affidavit is sought to be used.\n79. Form and contents of the affidavit. - The affidavit shall conform to the requirements of\norder XIX, rule 3 of Civil Procedure Code, 1908 (5 of 1908).\n80. Persons authorised to attest. - Affidavits shall be sworn or affirmed before an advocate\nor notary, who shall affix his official seal.\n81. Affidavits of illiterate, visually challenged persons. - Where an affidavit is sworn or\naffirmed by any person who appears to be illiterate, visually challenged or unacquainted with\nthe language in which the affidavit is written, the attester shall certify that the affidavit was\nread, explained or translated by him or in his presence to the deponent and that he seemed to\nunderstand it, and made his signature or mark in the presence of the attester which shall\ninclude all the information as specified in GSTAT FORM-05.\n82. Identification of deponent. - If the deponent is not known to the attester, his identity\nshall be testified by a person known to him and the person identifying shall affix his signature\nin token thereof.\n83. Annexures to the affidavit. - (1) Document accompanying an affidavit shall be referred\nto therein as Annexure number and the attester shall make the endorsement thereon that this\nis the document marked putting the Annexure number in the affidavit.\n(2) The attester shall sign therein and shall mention the name and his designation.\nCHAPTER XI\nDISCOVERY, PRODUCTION AND RETURN OF DOCUMENTS\n84. Application for production of documents, form of summons. -(1) Except otherwise\nprovided hereunder, discovery or production and return of documents shall be regulated by\nthe provisions of the Code of Civil Procedure, 1908 (5 of 1908).\n(2) An application for summons to produce documents shall be on plain paper setting out the\ndocument the production of which is sought, the relevancy of the document and in case where\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 51\nthe production of a certified copy would serve the purpose, whether application was made to\nthe proper officer and the result thereof.\n(3) A summons for production of documents in the custody of a public officer other than a\ncourt shall include all the information as specified in GSTAT FORM-06 and shall be\naddressed to the concerned Head of the Department or such other authority as may be\nspecified by the Appellate Tribunal.\n85. Suo motu summoning of documents. - Notwithstanding anything contained in these\nrules, the Appellate Tribunal may, suo motu, issue summons for production of public\ndocument or other documents in the custody of a public officer.\n86. Marking of documents. - (1) The documents when produced shall be marked as follows:\n(a) if relied upon by the appellant‘s or petitioner‘s side, they shall be numbered as ‗A‘\nseries;\n(b) if relied upon by the respondent‘s side, they shall be marked as ‗B‘ series; and\n(c) the Appellate Tribunal exhibits shall be marked as ‗C‘ series.\n(2) The Appellate Tribunal may direct the applicant to deposit with the Appellate Tribunal\nthrough online mode a sum sufficient to defray the expenses for transmission of the records.\n87. Return and transmission of documents. - (1) An application for return of the\ndocuments produced shall be numbered and no such application shall be entertained after the\ndestruction of the records.\n(2) The Appellate Tribunal may, at any time, direct return of documents produced subject to\nsuch conditions as it deems fit.\nCHAPTER XII\nEXAMINATION OF WITNESSES AND ISSUE OF COMMISSIONS\n88. Procedure for examination of witnesses, issue of Commissions. – The provisions of the\nOrders XVI and XXVI of the Code of Civil Procedure, 1908 (5 of 1908), shall mutatis\nmutandis apply in the matter of summoning and enforcing attendance of any person and\nexamining him on oath and issuing commission for the examination of witnesses or for\nproduction of documents.\n89. Examination in camera. - The Appellate Tribunal may in its discretion examine any\nwitness in camera.\n90. Form of oath or affirmation to witness. - Oath shall be administered to a witness in the\nfollowing form:\n\n―I do swear in the name of God or solemnly affirm that what I shall state shall be truth, the\nwhole truth and nothing but the truth‖.\n91. Form of oath or affirmation to interpreter. - Oath or solemn affirmation shall be\nadministered to the interpreter in the following form before the Bench officer or the Court\nofficer as the case may be, as taken for examining a witness–\n―I do swear in the name of God or solemnly affirm that I will faithfully and truly interpret\nand explain all questions put to and evidence given by witness and translate correctly and\naccurately all documents given to me for translation.‖\n92. Officer to administer oath. - The oath or affirmation shall be administered by the Court\nofficer.\n93. Form recording of deposition. - (1) The Deposition of a witness shall be recorded in\nprescribed GSTAT FORM-07.\n(2) Each page of the deposition shall be initiated by the Members constituting the Bench.\n(3) Corrections, if any, pointed out by the witness may, if the Bench is satisfied, be carried\nout and duly initialled. If not satisfied, a note to the effect be appended at the bottom of the\ndeposition.\n94. Numbering of witnesses. – The witnesses called by the applicant or petitioner shall be\nnumbered consecutively as PWs and those by the respondents as RWs.\n95. Grant of discharge certificate. – Witness discharged by the Appellate Tribunal may be\ngranted a certificate in prescribed GSTAT FORM-08 by the Registrar.\n96. Witness allowance payable. – (1) Where the Appellate Tribunal issues summons to a\ngovernment servant to give evidence or to produce documents, the person so summoned may\ndraw from the Government travelling and daily allowances admissible to him as per the\napplicable rules of the respective Government.\n(2) Where there is no provision for payment of travelling allowances and daily allowance by\nthe employer to the person summoned to give evidence or to produce documents, he shall be\nentitled to be paid as allowance, a sum which in the opinion of the Registrar is sufficient to\ndefray reasonable travelling and other expenses.\n(3) The party applying for the summons shall deposit with the Registrar the amount of\nallowance as estimated by the Registrar well before the summons is issued.\n(4) If the witness is summoned as a court witness, the amount estimated by the Registrar shall\nbe paid as per the directions of the Appellate Tribunal.\n(5) The aforesaid provisions would govern the payment of allowances to the interpreter as\nwell.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 53\n97. Records to be furnished to the Commissioner. – (1) The Commissioner shall be\nfurnished by the Appellate Tribunal with such of the records of the case as the Appellate\nTribunal considers necessary for executing the Commission.\n(2) Original documents shall be furnished only if a copy does not serve the purpose or cannot\nbe obtained without unreasonable expense or delay and delivery and return of records shall be\nmade under proper acknowledgement.\n98. Taking of specimen handwriting, signature etc. -The Commissioner may, if necessary,\ntake specimen of the handwriting, signature or fingerprint of any witness examined before\nhim.\nCHAPTER XIII\nDISPOSAL OF CASES AND PRONOUNCEMENT OF ORDERS\n99. Disposal of Cases. - On receipt of an application, petition, appeal etc, the Appellate\nTribunal, after giving the parties a reasonable opportunity of being heard, pass such orders\nthereon as it thinks fit:\nProvided that the Appellate Tribunal, after considering an appeal, may summarily\ndismiss the same, for reasons to be recorded, if the Appellate Tribunal is of opinion that there\nare no sufficient grounds for proceedings therewith.\n100. Operative portion of the order. - All orders or directions of the Bench shall be stated\nin clear and precise terms in the last paragraph of the order.\n101. Corrections. - Every Member of the Bench who has prepared the order shall affix his\ninitials at the bottom of each page and under all corrections.\n102. Power to impose Costs. - The Appellate Tribunal may, in its discretion, pass such order\nin respect of imposing costs on the defaulting party as it may deem fit\n103. Pronouncement of Order. - (1) The Appellate Tribunal, after hearing the applicant and\nrespondent, shall make and pronounce an order either at once or, as soon as thereafter as may\nbe practicable but not later than thirty days from the final hearing excluding vacations or\nholidays.\n(2) Every order of the Appellate Tribunal shall be in writing and shall be signed and dated by\nthe President or Member or Members constituting the Bench which heard the case and\npronounced the order.\n(3) A certified copy of every order passed by the Appellate Tribunal shall be given to the\nparties.\n(4) The Appellate Tribunal, may transmit order made by it to any court for enforcement, on\napplication made by either of the parties to the order or suo motu.\n(5) Every order or judgment or notice shall bear the seal of the Appellate Tribunal.\n\n104. Pronouncement of order by any one member of the Bench. –\n(1) Any Member of the Bench may pronounce the order for and on behalf of the Bench.\n(2) When an order is pronounced under this rule, the Court officer shall make a note in the\norder sheet, that the order of the Bench consisting of President or Members was pronounced\nin open court on behalf of the Bench.\n105. Authorising any member to pronounce order. – (1) If the Members of the Bench who\nheard the case are not readily available or have ceased to be Members of the Appellate\nTribunal, the President may authorise any other Member to pronounce the order on his behalf\nafter being satisfied that the order has been duly prepared and signed by all the Members who\nheard the case.\n(2) The order pronounced by the Member so authorised shall be deemed to be duly\npronounced.\n(3) The Member so authorised for pronouncement of the order shall affix his signature in the\norder sheet of the case stating that he has pronounced the order as provided in this rule.\n(4) If the order cannot be signed by reason of death, retirement or resignation or for any other\nreason by anyone of the Members of the Bench who heard the case, it shall be deemed to\nhave been released from part heard and listed afresh for hearing.\n106. Recusal. – (1) For the purpose of maintaining the high standards and integrity of the\nAppellate Tribunal, the President or a Member of the Appellate Tribunal shall recuse himself-\n(a) in any case involving persons with whom the President or the Member has or had\na personal, familial or professional relationship;\n(b) in any case concerning which the President or the Member has previously been\ncalled upon in another capacity, including as advisor, representative, expert or\nwitness; or\n(c) if there exist other circumstances such as to make the President or the Member‘s\nparticipation seem inappropriate.\n(2) The President or any Member recusing himself may record reasons for recusal:\nProvided that no party to the proceedings or any other person shall have a right to\nknow the reasons for recusal by the President or the Member in the case.\n107. Enlargement of time. - Where any period is fixed by or under these rules, or granted by\nAppellate Tribunal for the doing of any act, or filing of any document or representation, the\nAppellate Tribunal may, in its discretion from time to time in the interest of justice and for\nreasons to be recorded, enlarge such period, even though the period fixed by or under these\nrules or granted by the Appellate Tribunal may have expired.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 55\n108. Rectification of Order. - (1) Any clerical mistakes in any order of the Appellate\nTribunal or error therein arising from any accidental slip or omission may, at any time, be\ncorrected by the Appellate Tribunal on its own motion or on application of any party by way\nof rectification.\n(2) An application under sub-rule (1) shall be made online which shall include all the\ninformation as prescribed in GSTAT FORM-01 within one month from the date of the final\norder for rectification.\n109. General power to amend. – The Appellate Tribunal may, within a period of thirty days\nfrom the date of completion of pleadings, and on such terms as to costs or otherwise, as it\nmay think fit, amend any defect or error in any proceeding before it; and all necessary\namendments shall be made for the purpose of determining the real question or issue raised by\nor depending on such proceeding.\n110. Making of entries by Court officer. - Immediately on pronouncement of an order by\nthe Bench, the Court officer shall make necessary endorsement on the case file regarding the\ndate of such pronouncement, the nature of disposal and the constitution of the Bench\npronouncing the order and he shall also make necessary entries in the court diary which shall\ninclude all the information as specified in GSTAT CDR-02 maintained by him.\n111. Transmission of order by the Court officer. - (1) The Court officer shall immediately\non pronouncement of order, transmit the order with the case file to the Deputy Registrar or\nAssistant Registrar.\n(2) On receipt of the order from the Court officer, the Deputy Registrar or Assistant Registrar\nshall after due scrutiny, satisfy himself that the provisions of these rules have been duly\ncomplied with and in token thereof affix his initials with date on the outer cover of the order.\n(3) The Deputy Registrar or Assistant Registrar shall thereafter cause to transmit the case file\nand the order to the Registrar for taking steps to prepare copies and their communication to\nthe parties.\n112. Format of order. - (1) All orders shall be neatly and fairly typewritten in double space\non one side only on durable foolscap folio paper of metric A-4 size (30.5 cm long and 21.5\ncm wide) with left side margin of 5 cm and right-side margin of 2.5 cm. Corrections, if any,\nin the order shall be carried out neatly and sufficient space may be left both at the bottom and\nat the top of each page of the order to make its appearance elegant.\n(2) Members constituting the Bench shall affix their signatures in the order of their seniority\nfrom right to left.\n113. Indexing of case files after disposal. - After communication of the order to the parties\nor authorised representative, the official concerned shall arrange the records with pagination\nand prepare in the Index Sheet in Format prescribed by the Appellate Tribunal. He shall affix\ninitials and then transmit the records with the Index initials to the records room.\n\n114. Copies of orders in library. - (1) The officer in charge of the Registry shall send copies\nof every final order to the library of the Appellate Tribunal.\n(2) Copies of all orders received in each month shall be kept at the library in a separate\nfolder, arranged in the order of date of pronouncement, duly indexed and stitched.\n(3) At the end of every year, a consolidated index shall also be prepared and kept in a\nseparate file in the library.\n(4) The order folders and the indices may be made available for reference in the library to the\nauthorised representative.\nCHAPTER XIV\nElectronic filing and processing of appeals and conduct of proceedings in the Appellate\nTribunal in hybrid mode\n115. Electronic filing and processing of appeals and applications, etc.- (1)\nNotwithstanding anything contained in the foregoing Chapters I to XIV, except as may be\notherwise provided by order by the President.\n(2) Every appeal or application to be filed before the Appellate Tribunal shall be uploaded\nelectronically on the GSTAT portal.\n(3) All appeals and applications filed before the Appellate Tribunal shall be scrutinised and\nprocessed electronically through the GSTAT portal and all notices, communications and\nsummons shall be issued electronically and signed in the manner provided on the said portal.\n(4) All replies filed and documents that are or may be required to be presented before the\nAppellate Tribunal, either on the directions of the said Tribunal or otherwise, shall be\nsigned,verified and uploaded electronically on the GSTAT portal.\n(5) All proceedings before the Appellate Tribunal shall be conducted through the GSTAT\nportal and all such proceedings shall be recorded on the said portal.\n(6) A summary of the final order passed by the Appellate Tribunal, or any bench thereof, in\nrespect of any appeal shall be uploaded in the form specified in the CGST Rules for this\npurpose.\n(7) All hearings before the Appellate Tribunal may be conducted, either in the physical mode\nor upon the permission of the President, in the electronic mode,\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 57\nCHAPTER XV\nMiscellaneous\n116. Register of appeals, petitions, etc.- (1) A Register in prescribed GSTAT CDR--07 and\n08 shall be maintained in regard to appeals, petitions, etc., against the orders of the Appellate\nTribunal to the Hon‘ble Supreme Court and Hon‘ble High Courts and necessary entries\ntherein be promptly made by the judicial branch.\n(2) The register shall be placed for scrutiny by the President or Vice-President, as the case\nmay be, in the first week of every month.\n117. Placing of order of Hon’ble Supreme Court and Hon’ble High Courts before the\nAppellate Tribunal. – Whenever an interim or final order passed by the Hon‘ble Supreme\nCourt or Hon‘ble High Courts in an appeal or other proceeding preferred against a decision\nof the Appellate Tribunal is received, the same shall forthwith be placed before the President\nand same Bench of Members for information and kept in the relevant case file and immediate\nattention of the Registrar shall be drawn to the directions requiring compliance.\n118. Registrar to ensure compliance of Hon’ble Supreme Court or Hon’ble High Courts\norders. – It shall be the duty of the Registrar to take expeditious steps to comply with the\ndirections of the Hon‘ble Supreme Court/Hon‘ble High Courts in matters pertaining to the\nAppellate Tribunal.\n119. Fees. — (1) In respect of the several matters, there shall be paid fees as prescribed in the\nSchedule of Fees appended to these rules:\nProvided that no fee shall be payable or shall be liable to be collected on a petition or\napplication filed or reference made by any departmental authority connected with a matter in\nquestion before the Appellate Tribunal.\n(2) In respect of every interlocutory application, there shall be paid fees as prescribed in\nSchedule of Fees of these rules:\nProvided that no fee shall be payable or shall be liable to be collected on a petition or\napplication filed or reference made by any departmental authority connected with a matter in\nquestion before the Appellate Tribunal.\n(3) In respect of a petition or appeal or application filed or references made before the\nPrincipal Bench or the Bench of the Appellate Tribunal, fees referred to in this Part shall be\npaid on GSTAT portal in the manner provided thereon.\n120. Award of costs in the proceedings. — (1) Whenever the Appellate Tribunal deems fit,\nit may award cost for meeting the legal expenses of the respondent of defaulting party.\n(2) The Appellate Tribunal may in suitable cases direct appellant or respondent to bear the\ncost of litigation of the other side, and in case of abuse of process of court, impose exemplary\ncosts on defaulting party.\n\n121. Dress for the Members. — The dress for the Members shall be such as the President\nmay prescribe.\n122. Dress for the parties. — Every authorised representative other than a relative or regular\nemployee of a party shall appear before the Appellate Tribunal in his professional dress, if\nany, and, if there is no such dress —\n(a) if a male, in a close-collared black coat, or in an open-collared black coat, with\nwhite shirt and black tie; or\n(b) if a female, in a black coat over a white sari or any other white dress:\nProvided that during the summer season from the 15th April to 31st August, the\nauthorised representatives may, when appearing before a Bench of the Appellate Tribunal,\ndispense with the wearing of a black coat.\nExplanation. - For the purpose of this rule, the expression, ―regular employee of a party‟\nshall not include a departmental officer who is appointed as an authorised representative.\n123. Removal of difficulties and issuance of directions. - Notwithstanding anything\ncontained in the rules, wherever the rules are silent or no provisions have been made, the\nPresident may issue appropriate directions to remove difficulties and issue such orders or\ncirculars to govern the situation or contingency that may arise in the working of the Appellate\nTribunal.\n124. Inspection of the State Benches. – The President, or any Judicial or Technical Member\nof the Principal Bench, nominated by the President, shall have the authority to inspect the\noffice and proceedings of the State Benches, as per procedure and rules for travel and\ninspection as decided by the President.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 59\nGSTAT FORM -01\n[See rule 29 and 49]\nInterlocutory Application to the Appellate Tribunal\n1. GSTIN or Temporary Identification or Unique Identification Number –\n2. Name of the appellant/applicant/respondent –\n3. Address of the appellant/applicant/respondent –\n4. Original Appeal Number- Date-\n5. Date of last hearing –\n6. Name of the representative –\n7. Purpose of the Interlocutory application –\n8. Whether the appellant or applicant or respondent wishes to be heard in person -\n9. Statement of facts -\n10. Grounds of application -\n11. Prayer -\nPlace:\nDate:\nSignature\nName of the appellant or applicant or respondent\nDesignation or Status\n\nGSTAT FORM -02 - ORDER SHEET\n[See rule 54]\n(in Appeal)\nNo........................................ Registrar\nAppellate Tribunal\n(Appellant) Vs (Respondent)\n------------------------------------------------------------------------------------------\nSl. No., or Brief order, mentioning How complied\nOrder and date Reference, if necessary with and date of\ncompliance\n------------------------------------------------------------------------------------------\n1. Form of Appeal presented by hand or\nreceived by post or online from Appellant\non...........................has been registered.\nIt is in order .........................\nIt is not in order for the reasons stated.\n1.\n2.\n3.\n4.\nFor Deputy Registrar\nor Assistant Registrar\n2. A copy of Order be\nsent to the respondent or appellant\nFor Deputy Registrar\nor Assistant Registrar\nDispatched on.........\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 61\nFormat of Indexing\n[See rule 66 and 113]\n1. Appeal No.-\n2. Appellants‘ Name(s), (GSTIN, if any) and Address –\n3. Respondent name(s), (GSTIN, if any) and Address –\n4. No. of Order in Appeal –\n5. Period of dispute –\n6. Section under which original order passed –\n7. State Jurisdiction –\n8. Bench to which assigned and whether single member case-\n9. Name of Members -\n10. Date of Hearings -\n11. Interim Order, if any with date –\n12. Date of final appeal order -\n13. Nature of order allowed, partly allowed or dismissed –\n14. Remarks –\n\nGSTAT FORM-03 - INSPECTION\n[See rule 67]\nApplication to the Registrar for inspection of records\n1. GSTIN/ Temporary Identification /Unique Identification Number –\n2. Name of the appellant –\n3. Address of the appellant –\n4. Original Appeal/Order Number - Date-\n5. Grounds of inspection –\n6. Purpose of inspection –\n7. Details of payment -\n8. Detail of documents for inspection –\n(i) ………..\n(ii) ………..\n(iii) ……………\n9. Remarks, if any -\nPlace:\nDate:\nSignature\n(Name of the Applicant)\nDesignation or Status.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 63\nSCHEDULE OF\nFEES\nS.No. Relevant Nature of application / petition Fees\nSection/Rules\n1. Rule 67 of GSTAT Application for Inspection of Records Rs.5000\nProcedural Rules\n2025\n2. Rule 118(2) of Interlocutory Applications Rs.5000\nGSTAT procedural\nRules 2025\n3. Rule 110(5) of Appeals to GSTAT As per\nCGST/SGST/UTGST rule\nRules 2017\n4. Application under any other provisions specifically not mentioned herein above Rs.5000\n5. Fee for obtaining certified true copy of final order passed to parties other than the Rs.5 per\nconcerned parties under Rule page\n\nGSTAT FORM-04\n(see rule 72)\nMemorandum of appearance\nTo\nThe Registrar,\nThe Goods and Services Tax Appellate Tribunal\nIn the matter of …………. Petitioner.\nVs.\n………………..Respondent\n(Appeal No. ………of 20………)\nSir,\nPlease take notice that I, …….., authorised representative/ practising Chartered\nAccountant/practising Cost Accountant/ legal practitioner, duly authorised to enter\nappearance, and do hereby enter appearance, on behalf of …………….. petitioner/\nrespondent/ Registrar/ Government of ………………….. in the above-mentioned petition.\n*A copy of the authorisation/vakalatnama issued by the Appellant or Respondent authorising\nme to enter appearance and to act for every purpose connected with the proceedings for the\nsaid party is enclosed, duly signed by me for identification.\nYours sincerely,\nDated ………. day of ……………\nAddress:\nEnclosure: as aforesaid Tele No.:\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 65\nGSTAT FORM-05\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\n[See rule 6 and 81]\n(Certification when deponent is unacquainted with the language of the affidavit or is blind or\nilliterate)\nContents of the affidavit were truly and audibly read over/translated into ………...............\nlanguage known to the deponent and he seems to have understood the same and affixed his\nLeft Thumb Impression/Signature/Mark.\n(Signature)\nName and designation with date.\n\nGSTAT FORM-06 - SUMMONS\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\n[See rule 84(3)]\nTo,\n…………\nWhereas the Appellate Tribunal suo motu or on consideration of the request made by Shri/\nSmt/ M/s …………………..(Appellant/Respondent) having been satisfied that production of\nthe following documents or records under your control or custody is necessary for proper\ndecision of the above case, you are hereby directed to cause production of the said\ndocuments/records before this Tribunal /forward duly authenticated copies thereof on or\nbefore the …………………day of…..20………\n(Enter description of documents requisitioned)\n―By Order of Appellate Tribunal‖\nRegistrar.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 67\nGSTAT FORM-07\n[See rule 93]\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\nAppeal No…………… of 20……………\nDeposition of Petitioner’s Witness or Respondent’s Witness\n1. Name :\n2. Father‘s/Mother‘s/Husband‘s Name :\n3. Age :\n4. Occupation :\n5. Place of Residence and address :\n6. Name of the Officer administering the\nOath / affirmation :\n7. Name of the Interpreter if any, duly\nSworn/ solemnly affirmed :\nDuly sworn/ solemnly/ affirmed\nExamination-in-chief: By\nDate:\n…………………………………………………………………….\nCross-examination: By\n……………………………………………………………………\nRe-examination, if any:\n……………………………………………………………………\n(Signature of the witness on each page)\nStatement of witness as recorded was read over/translated to the witness, who admitted it to\nbe correct.\nSignature of the Member of the Appellate Tribunal with date.\n\nGSTAT FORM-08\n[See rule 95]\nCERTIFICATE OF DISCHARGE\nCertified that …………………………………………… appeared before this Appellate\nTribunal as a witness/in/Appeal No. …………………………..of 20……, on behalf of the\nappellant or respondent as Court witness on this ……………day of ….20…… and that he\nwas relieved at ………………….on…………………… He was paid/not paid any T.A. and\nD.A. or allowance of Rs……………….\nSignature of the Registrar\n(Seal of the Appellate Tribunal).\nDate :\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 69\nCAUSE LIST- GSTAT CDR-01\n[See rule 38]\nDate:\nSl.No. Court Name of Appeal Interlocutory Purpose Section Name Name of Name of Remarks\nNo. the No. Application or of AR for counsel for\nand Members Main Parties Petitioner Respondent\nTime Application or\nAppellant\n\nGSTAT CDR -02 - COURT DIARY\n[See rule and 53 and 110]\nSl. Appeal Appellant or Time at Time Time at Time Whether If not, Whether Whether order Whether Initials Remarks\nNo. No. Respondent which at which at the Member the is reserved, if matter is of\nsitting of which Bench re- which judgement to whom matter is so, the date of adjourned Gazetted\nBench the assembled the is dictated the case part- pronouncement with date Officer\ncommenced Bench Bench in the is heard, if of the order then the\nrose finally open assigned so the next date\nfor rose court, if so for next of hearing\nlunch for the by which passing date\nbreak day Member the order given\nand Which for\nSPS or PA hearing\ntook\ndictation\n1 2 3 4 5 6 7 8 9 10 11 12 13 14\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 71\nGSTAT-CDR -03 - Register of Provisional Appeals\n[See rule 59(a)]\nSl. Prov. Appellants‘ Respondent No. of State Appeal Payment of fee Remarks\nNo. Appeal Name(s) and name(s) and Order in Jurisdiction accepted or\nNo. Address Address Appeal rejected with\ndate\n1 2 3 4 5 6 7 8 9\nGSTAT- CDR -04- Register of Appeals\n[See rule 59(b)]\nSl. Appeal Appellants‘ Respondent No. of Period of Section State Bench to Interim Date of Nature of Remarks\nNo. No. Name(s) and name(s) and Order in dispute under Jurisdiction which Order, if final order\nAddress Address Appeal which assigned and any with appeal allowed,\noriginal whether date order partly\norder single allowed or\npassed member case dismissed\n1 2 3 4 5 6 7 8 9 10 11 12 13\nGSTAT-CDR -05 - Register of Interlocutory Appeals\n[See rule 59(c)]\nSl. Original No. of Appellants‘ Respondent Bench for Date of Order- whether Remarks\nNo. Appeal Interlocutory Name(s) and Name(s) and which order in allowed or\nNo. Appeal Address Address application/ interlocutory dismissed, with\nappeal filed application date\n1 2 3 4 5 6 7 8 9\n\nGSTAT-CDR -06- Register of Inspection\n[See rule 71 ]\nSl. No. of Name of No. of Appeal Application Payment of Fee Date of Signature of the Inspection Remarks\nNo. Application Applicant and related, if any dismissed or Inspection and applicant Supervisory\nwith date Address allowed with date conclusion Officer\n1 2 3 4 5 6 7 8 9\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 73\nGSTAT CDR - 07-SUPREME COURT\n[See rule 116]\nCourt No. of No. of Name of the Date of Date of receipt Appeal Interim Final order Direction Steps Remarks\nNo. Appeal Order in Applicant or dispatch of records at dismissed or Direction\nBefore the Appeal Respondent of records to GSTAT allowed with If any, in the If any, for Taken for\nGSTAT GSTAT date with date appeal with compliance compliance\ndate by the\nAppellate\nTribunal\n1 2 3 4 5 6 7 8 9 10 11 12\nGSTAT CDR -08 – HIGH COURT\n[See rule 116]\nCourt No. No. of No. of Name of the Date of Date of Appeal Interim Final Direction Steps Remarks\nAppeal Order in Applicant or dispatch receipt of dismissed or Direction order\nBefore the Appeal Respondent of records to records at allowed with If any, If any, for Taken for\nGSTAT GSTAT GSTAT date with date in the compliance by compliance\nappeal the Appellate\nwith date Tribunal\n1 2 3 4 5 6 7 8 9 10 11 12\n[F. No. A-50050/264/2024-GSTAT-DoR]\nS.S.SHARDOOL, Registrar GST Appellate Tribunal\nUploaded by Dte. of Printing at Government of India Press, Ring Road, Mayapuri, New Delhi-110064\nand Published by the Controller of Publications, Delhi-110054.",
    "tags": "GSTAT, appeal procedure, tribunal rules, Section 111 CGST Act, filing, hearing, Chapter III, paper format, vakalatnama, memorandum of appeal",
    "is_global": true
  },
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "Chapter III — Rules 18-37",
    "title": "GSTAT Rules 2025 — Chapter III: Institution of Appeals (Filing, Format, Paper Specs)",
    "full_text": "CHAPTER III\nInstitution of appeals - Procedure\n18. Filing of appeals. – (1) An appeal to the Appellate Tribunal shall be filed online on\nGSTAT Portal in Form prescribed under the Rules, and shall contain the following details,\nnamely :-\n(a) the cause title shall state ―In the Goods and Service Tax Appellate\nTribunal‖ and also set out the proceedings or order of the authority\nagainst which it is preferred;\n(b) appeal shall be divided into paragraphs and shall be numbered\nconsecutively, and each paragraph shall contain as nearly as may be, a\nseparate fact or allegation or point;\n(c) full name, parentage, Goods and Services Tax Identification Number,\ndescription of each party and address, as applicable, shall also be set\nout at the beginning of the appeal and need not be repeated in the\nsubsequent proceedings in the same appeal; and\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 37\n(d) the names of parties shall be numbered consecutively and a separate\nline should be allotted to the name and description of each party and\nthese numbers shall not be changed and in the event of the death of a\nparty during the pendency of the appeal, his legal heirs or\nrepresentative, as the case may be, if more than one, shall be shown by\nsub-numbers.\n(2) Notwithstanding the number of show cause notices, refund claims or demands, letters\nor declarations dealt with in the decision or order appealed against, it shall suffice for\npurposes of these rules that the appellant files one appeal in prescribed Form against the order\nor decision of the appellate authority, along with such number of copies thereof as provided\nin sub-rule 21.\n(3) In a case where the –\n(a) impugned order-in-appeal has been passed with reference to more than one\norders-in-original, the prescribed Form for appeal filed as per the Rules shall be as\nmany as the number of the orders-in-original to which the case relates in so far as the\nappellant is concerned;\n(b) In case an impugned order is in respect of more than one person, each\naggrieved person will be required to file a separate appeal, and common appeals or\njoint appeals shall not be entertained.\n19. Date of presentation of appeals. -- The Registrar or, as the case may be, the officer\nauthorised by him, shall endorse on every Form of appeal the date on which it is presented or\ndeemed to have been presented under that rule and shall sign the endorsement, if the appeal is\nfiled manually.\n20. Contents of an appeal Form. – (1) Every Form of appeal shall set forth concisely and\nunder distinct heads, the grounds of appeal and such grounds shall be numbered\nconsecutively and shall be typed in double space of the paper.\n(2) Every Form of appeal, cross-objections, reference applications, stay applications or any\nother miscellaneous applications shall also be typed neatly in double spacing on the A4 size\npaper and the same shall be duly paged, indexed and tagged firmly with Form of appeal in a\nseparate folder.\n(3) Every Form of appeal or application or cross-objection shall be signed and verified by the\nappellant or applicant or respondent or the authorised representative. The appellant or\napplicant or respondent or the authorised representative shall certify as true copy the\ndocuments produced before the Appellate Tribunal.\n21. Documents required to accompany Form of appeal. – (1) Every Form of appeal\nrequired to be heard by the Appellate Tribunal shall be accompanied by a certified copy of\nthe order appealed against in the case of an appeal against the original order passed by the\nadjudicating authority and where such an order has been passed in appeal or revision, there\nshall be a certified copy of the order passed in appeal or in revision along with the order of\nthe original authority along with all the relevant documents including relied upon documents:\n\nProvided that where an application filed under the direction of the Commissioner, the\ncopy of the order appealed against shall be an attested copy instead of a certified copy.\n(2) A certified copy of the decision or order appealed against along with fees as specified in\nsub-rule 5 of rule 110 of the Rules shall be submitted online and a final acknowledgement,\nshall be issued the Rules, by the GSTAT Portal.\n(3) The President may further direct that in case of non-filing of the documents as specified\nunder this Rule, the Registrar or any other authorised officer would be competent to return\nthe specified documents or sets of documents and to receive the same back only after\nrectification of the defects to the satisfaction of the Registrar or any other authorised officer\nor the Bench as the case may be and on the return the case may be assigned a new number.\n(4) The Appellate Tribunal may on its own motion direct the preparation of as many copies as\nmay be required of all the relevant documents including relied upon documents by and at the\ncost of the appellant or the respondent, containing copies of such statements, papers or\ndocuments as it may consider necessary for the proper disposal of the appeal;\n(5) President may by a general or special order allow attestation of the documents filed along\nwith appeal or application or as a part of relevant documents including relied upon documents\nor otherwise by a gazetted officer or such other person as may be authorised by the President\nto attest or certify such documents or photo copies thereof; and\n(6) All relevant documents including relied upon documents shall be clearly legible, duly\npaged, indexed and tagged firmly.\n22. Endorsement and verification. - At the foot of every appeal or pleading along with all\nthe relevant documents including relied upon documents, there shall appear the name and\nsignature of the authorised representative and every appeal or pleadings shall be signed and\nverified by the party concerned in the manner provided by these rules.\n23. Translation of documents. – (1) A document other than English language intended to be\nused in any proceeding before the Appellate Tribunal shall be received by the Registry\naccompanied by a translated copy in English, which is agreed to by both the parties or\ncertified to be a true translated copy by the authorised representative engaged on behalf of\nparties in the case;\n(2) Appeal or other proceeding shall not be set down for hearing until and unless all parties\nconfirm that all the documents filed on which they intend to rely are in English or have been\ntranslated into English and required number of copies are filed with the Appellate Tribunal.\n24. Endorsement and scrutiny of petition or appeal or document. – (1) If, on scrutiny, the\nappeal, application or any other document is found to be defective, such document shall, after\nnotice to the party, be returned for compliance and if there is a failure to comply within seven\nworking days from the date of return, the same shall be placed before the Registrar who may\npass appropriate orders.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 39\n(2) The Registrar may for sufficient cause return the said documents for rectification or\namendment to the party filing the same, and for this purpose may allow to the party\nconcerned such reasonable time as he may consider necessary or extend the time for\ncompliance, in any case not exceeding thirty days from the date of filing of the said\ndocuments.\n(3) Where the party fails to take any step for the removal of the defect within the time fixed\nfor the same, the Registrar may, for reasons to be recorded in writing, decline to register the\nappeal or pleading or document.\n(4) Where, after a personal hearing, the Registrar is not satisfied with the steps taken by the\nparty for removal of defects, he shall list the same with defects for hearing before the\nappropriate bench of the Tribunal and the Bench may, after hearing the party, accept to\nregister the appeal or may, in its discretion, reject the said appeal.\n25. Registration of admitted appeals. - On admission of appeal, the same shall be numbered\nand registered in the appropriate register maintained in this behalf and its number shall be\nentered therein (Index to be modified accordingly).\n26. Ex-parte amendments. - In every appeal or application, arithmetical, grammatical,\nclerical and such other errors may be rectified on the orders of the Registrar without notice to\nParties:\nProvided that no amendments shall be allowed ex-parte after appearance of the\nrespondents.\n27. Calling for records. On the admission of appeal, the Registrar shall, if so directed by the\nAppellate Tribunal, call for the records relating to the proceedings from the respective Bench\nof Appellate Tribunal or adjudicating authority and retransmit the same at the conclusion of\nthe proceedings or at any time.\n28. Production of authorization for and on behalf of an applicant or respondent or\nparty.- Where an appeal is purported to be instituted by or on behalf of an applicant or\nrespondent or party, the person who signs or verifies the same shall produce along with such\nappeal, for verification by the Registrar, a true copy of authorization letter empowering such\nperson to do so:\nProvided that the Registrar may at any time call upon the party to produce such\nfurther materials as he deems fit for satisfying himself about due authorisation.\n29. Interlocutory applications.– Every interlocutory application for stay, direction,\nrectification in order, condonation of delay, early hearing, exemption from production of\ncopy of order appealed against or extension of time prayed for in pending matters shall\ninclude all the information as per the prescribed GSTAT FORM-01 and the requirements\nprescribed in that behalf shall be complied with by the applicant, besides filing an affidavit\nsupporting the application.\n\n30. Procedure on production of defaced, torn or damaged documents.- When a document\nproduced along with any pleading appears to be defaced, torn, or in any way damaged or\notherwise its condition or appearance requires special notice, a mention regarding its\ncondition and appearance shall be made by the party producing the same in the Index of such\na pleading and the same shall be verified and initialed by the officer authorised to receive the\nsame.\n31. Grounds which may be taken in appeal.- The appellant shall not, except by leave of the\nAppellate Tribunal, urge or be heard in support of any grounds not set forth in the Form of\nappeal, but the Appellate Tribunal, in deciding the appeal, shall not be confined to the\ngrounds set forth in the Form of appeal or those taken by leave of the Appellate Tribunal\nunder these rules:\nProvided that the Appellate Tribunal shall not rest its decision on any other grounds\nunless the party who may be affected thereby has had a sufficient opportunity of being heard\non that ground.\n32. Rejection or amendment of Form of appeal. — (1) The Registrar may, in its\ndiscretion, on sufficient cause being shown, accept a Form of Appeal which is not\naccompanied by the documents referred to in rule 21 or is in any other way defective, and in\nsuch cases may require the appellant to file such documents or as the case may be, make\nnecessary amendments within such time as it may allow, which may in any case not exceed\nthirty days.\n(2) The Registrar may reject the Form of Appeal, if the documents referred to therein are not\nproduced, or the amendments are not made, within the time-limit allowed.\n(3) The President may in his discretion authorise any officer of the Appellate Tribunal to.\n(a) return any Form of appeal, application or documents filed manually and which\nis/are not in accordance with these Rules; and\n(b) allow the documents to be refiled after removal of the defects in the specified\ntime.\n(5) On representation, the Bench concerned may in its discretion either accept the Form of\nAppeal in terms of above rules but the appeal or application may not be restored to its\noriginal number unless the Bench allows it to be so restored on sufficient cause being shown.\n33. Who may be joined as respondents. — (1) In an appeal or an application filed by a\nperson other than the [Commissioner], the [Commissioner] concerned shall be made the\nrespondent to the appeal or the application, as the case may be.\n(2) In an appeal or an application by the [Commissioner], the other party shall be made the\nrespondent to the appeal.\n34. Endorsing copies to the party. — A copy each of appeal and relevant documents along\nwith relied upon documents shall be provided to the respondent as well as to the concerned\nCommissioner, as the case may be, as soon as they are filed.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 41\n35. Filing of Form of cross-objections, applications or replies to appeals or applications.\n— Every Form of cross-objections filed as prescribed under CGST or SGST or UTGST\nRules 2017, and every application made, under the provisions of the Act, shall be registered\nand numbered, and the provisions of these rules, relating to appeals shall, so far as may be,\napply to such form or application.\n36. Filing of reply and other documents by the respondents. – (1) Each respondent may\nfile his reply to the petition or the application and copies of the documents, either in person or\nthrough an authorised representative, with the registrar as specified by the Appellate Tribunal\nwithin one month of the receipt thereof. A copy of such reply and the copies of other\ndocuments shall be forthwith served on the applicant by the respondent.\n(2) On being served the reply or documents under sub-rule (1), the applicant shall specifically\nadmit, deny, or rebut the facts stated by the respondent in his submission and state such\nadditional facts as may be found necessary.\n37. Filing of rejoinder. – Where the respondent states such additional facts as may be\nnecessary for the just decision of the case, the Bench may allow the petitioner to file a\nrejoinder to the reply filed by the respondent on GSTAT portal, with an advance copy to be\nserved upon the respondent within one month or within such time as may be specified or\nextended by Bench.\n",
    "tags": "GSTAT, Chapter III, appeal filing, memorandum, paper size, margin, font, index, vakalatnama, Rule 18, Rule 19, Rule 20, Rule 21, annexures, certified copy",
    "is_global": true
  },
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "Chapter V — Rules 41-52",
    "title": "GSTAT Rules 2025 — Chapter V: Hearing of Appeal",
    "full_text": "CHAPTER V\nHearing of Appeal\n41. Hearing of appeal. — (1) On the day fixed, or on any other day to which the hearing\nmay be adjourned, the appellant shall be heard in support of the appeal.\n(2) The Appellate Tribunal shall then, if necessary, hear the respondent against the appeal and\nin such a case the appellant shall be entitled to reply.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 43\n42.Action on appeal for appellant’s default. — Where on the day fixed for the hearing of\nthe appeal or on any other day to which such hearing may be adjourned, the appellant does\nnot appear when the appeal is called on for hearing, the Appellate Tribunal may, in its\ndiscretion, either dismiss the appeal for default or hear and decide it on merits :\nProvided that where an appeal has been dismissed for default and the appellant\nappears afterwards and satisfies the Appellate Tribunal that there was sufficient cause for his\nnon-appearance when the appeal was called on for hearing, the Appellate Tribunal shall make\nan order setting aside the dismissal and restore the appeal.\n43. Hearing of appeals ex parte. — Where on the day fixed for the hearing of the appeal or\non any other day to which the hearing is adjourned the appellant appears and the respondent\ndoes not appear when the appeal is called on for hearing, the Appellate Tribunal may hear\nand decide the appeal ex parte.\n44. Continuance of proceedings after death or adjudication as an insolvent of a\nparty to the appeal. – Where in any proceedings the appellant or a respondent dies or is\nadjudicated as an insolvent or in the case of a company, is being wound up, the appeal or\napplication shall abate, unless an application is made for continuance of such proceedings by\nor against the successor-in-interest, the executor, receiver, liquidator or other legal\nrepresentative of the appellant or respondent, as the case may be:\nProvided that every such application shall be made within a period of sixty days of the\noccurrence of the event:\nProvided further that the Appellate Tribunal may, if it is satisfied that the applicant\nwas prevented by sufficient cause from presenting the application within the period so\nspecified, allow it to be presented within such further period as it may deem fit.\n45. Production of additional evidence. — (1) The parties to the appeal shall not be entitled to\nproduce any additional evidence, either oral or documentary, before the Appellate Tribunal :\nProvided that if the Appellate Tribunal is of opinion that any documents shall be\nproduced or any witness shall be examined or any affidavit shall be filed to enable it to pass\norders or for any sufficient cause, or if adjudicating authority or the appellate or revisional\nauthority has decided the case without giving sufficient opportunity to any party to adduce\nevidence on the points specified by them or not specified by them, the Appellate Tribunal\nmay, for reasons to be recorded, allow such documents to be produced or witnesses to be\nexamined or affidavits to be filed or such evidence to be adduced.\n(2) The production of any document or the examination of any witness or the adducing of any\nevidence under sub-rule (1) may be done either before the Appellate Tribunal or before such\nauthority as the Appellate Tribunal may direct.\n(3) Where any direction has been made by the Appellate Tribunal to produce any documents\nor to examine any witnesses or to adduce any evidence before any authority, the authority\nshall comply with the directions of the Appellate Tribunal and after such compliance send the\n\ndocuments, the record of the deposition of the witnesses or the record of evidence adduced, to\nthe Appellate Tribunal.\n(4) The Appellate Tribunal may, of its own motion, call for any documents or summon any\nwitnesses on points at issue, if it considers necessary to meet the ends of justice.\n46. Production of evidence by Affidavit. – (1) The Appellate Tribunal may direct the parties\nto give evidence, if any, by affidavit.\n(2) Notwithstanding anything contained in sub-rule (1) where the Appellate Tribunal\nconsiders it necessary in the interest of natural justice, it may order cross-examination of any\ndeponent on the points of conflict either through information and communication technology\nfacilities such as video conferencing or otherwise as may be decided by the Appellate\nTribunal, on an application moved by any party.\n47. Adjournment of appeal. — The Appellate Tribunal may, on such terms as deem fit and\nat any stage of the proceedings, adjourn the hearing of the appeal.\n48. Proceedings to be open to public — The proceedings before the Appellate Tribunal\nshall be open to the public:\nProvided that the Appellate Tribunal may, if deem fit, order at any stage of the\nproceedings of any particular case that the public generally or any particular person shall not\nhave access to, or be or remain in the room or building used by the Appellate Tribunal.\n49. Procedure for filing of and disposal of interlocutory application. — The provisions of\nthe rules regarding the filing of interlocutory applications shall, in so far as may be, apply\nmutatis mutandis to the filing of applications under this rule.\n50. Appeal referred to larger Bench. – In case of different opinion of Members of Bench\nwhile hearing an appeal, the appeal shall be referred to larger Bench by the President, as it\ndeems fit, for disposal of the appeal.\n51. Order to be signed and dated. – (1) Every order of the Appellate Tribunal shall be in\nwriting and shall be signed and dated by the Members constituting the Bench concerned.\n(2) Last date of hearing of the matter shall be typed on the first page of the order.\n(3) If the order is dictated on the Bench, the date of dictation will be the date of the final\norder.\n(4) If the order is reserved, the date of final order will be the date on which the order is\npronounced.\n(5) In cases, where gist of the decision is pronounced without the detailed order, the last para\nof the detailed order shall specify the date on which the gist of the decision was pronounced\nand in such cases, the date of the final order shall be the date on which all the Members of the\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 45\nBench sign the order and where the order is signed on different dates by the Members of the\nBench, the last of the dates will be the date of the order.\n52. Publication of orders. — Such of the orders of the Appellate Tribunal as are deemed fit\nfor publication in any authoritative report or the press, may be released for such publication\non such terms and conditions as the Appellate Tribunal may lay down.\n",
    "tags": "GSTAT, Chapter V, hearing, adjournment, ex-parte, Rule 41, Rule 42, Rule 43, oral argument",
    "is_global": true
  },
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "Chapter XIII — Rules 99-115",
    "title": "GSTAT Rules 2025 — Chapter XIII: Disposal of Cases and Pronouncement of Orders",
    "full_text": "CHAPTER XIII\nDISPOSAL OF CASES AND PRONOUNCEMENT OF ORDERS\n99. Disposal of Cases. - On receipt of an application, petition, appeal etc, the Appellate\nTribunal, after giving the parties a reasonable opportunity of being heard, pass such orders\nthereon as it thinks fit:\nProvided that the Appellate Tribunal, after considering an appeal, may summarily\ndismiss the same, for reasons to be recorded, if the Appellate Tribunal is of opinion that there\nare no sufficient grounds for proceedings therewith.\n100. Operative portion of the order. - All orders or directions of the Bench shall be stated\nin clear and precise terms in the last paragraph of the order.\n101. Corrections. - Every Member of the Bench who has prepared the order shall affix his\ninitials at the bottom of each page and under all corrections.\n102. Power to impose Costs. - The Appellate Tribunal may, in its discretion, pass such order\nin respect of imposing costs on the defaulting party as it may deem fit\n103. Pronouncement of Order. - (1) The Appellate Tribunal, after hearing the applicant and\nrespondent, shall make and pronounce an order either at once or, as soon as thereafter as may\nbe practicable but not later than thirty days from the final hearing excluding vacations or\nholidays.\n(2) Every order of the Appellate Tribunal shall be in writing and shall be signed and dated by\nthe President or Member or Members constituting the Bench which heard the case and\npronounced the order.\n(3) A certified copy of every order passed by the Appellate Tribunal shall be given to the\nparties.\n(4) The Appellate Tribunal, may transmit order made by it to any court for enforcement, on\napplication made by either of the parties to the order or suo motu.\n(5) Every order or judgment or notice shall bear the seal of the Appellate Tribunal.\n\n104. Pronouncement of order by any one member of the Bench. –\n(1) Any Member of the Bench may pronounce the order for and on behalf of the Bench.\n(2) When an order is pronounced under this rule, the Court officer shall make a note in the\norder sheet, that the order of the Bench consisting of President or Members was pronounced\nin open court on behalf of the Bench.\n105. Authorising any member to pronounce order. – (1) If the Members of the Bench who\nheard the case are not readily available or have ceased to be Members of the Appellate\nTribunal, the President may authorise any other Member to pronounce the order on his behalf\nafter being satisfied that the order has been duly prepared and signed by all the Members who\nheard the case.\n(2) The order pronounced by the Member so authorised shall be deemed to be duly\npronounced.\n(3) The Member so authorised for pronouncement of the order shall affix his signature in the\norder sheet of the case stating that he has pronounced the order as provided in this rule.\n(4) If the order cannot be signed by reason of death, retirement or resignation or for any other\nreason by anyone of the Members of the Bench who heard the case, it shall be deemed to\nhave been released from part heard and listed afresh for hearing.\n106. Recusal. – (1) For the purpose of maintaining the high standards and integrity of the\nAppellate Tribunal, the President or a Member of the Appellate Tribunal shall recuse himself-\n(a) in any case involving persons with whom the President or the Member has or had\na personal, familial or professional relationship;\n(b) in any case concerning which the President or the Member has previously been\ncalled upon in another capacity, including as advisor, representative, expert or\nwitness; or\n(c) if there exist other circumstances such as to make the President or the Member‘s\nparticipation seem inappropriate.\n(2) The President or any Member recusing himself may record reasons for recusal:\nProvided that no party to the proceedings or any other person shall have a right to\nknow the reasons for recusal by the President or the Member in the case.\n107. Enlargement of time. - Where any period is fixed by or under these rules, or granted by\nAppellate Tribunal for the doing of any act, or filing of any document or representation, the\nAppellate Tribunal may, in its discretion from time to time in the interest of justice and for\nreasons to be recorded, enlarge such period, even though the period fixed by or under these\nrules or granted by the Appellate Tribunal may have expired.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 55\n108. Rectification of Order. - (1) Any clerical mistakes in any order of the Appellate\nTribunal or error therein arising from any accidental slip or omission may, at any time, be\ncorrected by the Appellate Tribunal on its own motion or on application of any party by way\nof rectification.\n(2) An application under sub-rule (1) shall be made online which shall include all the\ninformation as prescribed in GSTAT FORM-01 within one month from the date of the final\norder for rectification.\n109. General power to amend. – The Appellate Tribunal may, within a period of thirty days\nfrom the date of completion of pleadings, and on such terms as to costs or otherwise, as it\nmay think fit, amend any defect or error in any proceeding before it; and all necessary\namendments shall be made for the purpose of determining the real question or issue raised by\nor depending on such proceeding.\n110. Making of entries by Court officer. - Immediately on pronouncement of an order by\nthe Bench, the Court officer shall make necessary endorsement on the case file regarding the\ndate of such pronouncement, the nature of disposal and the constitution of the Bench\npronouncing the order and he shall also make necessary entries in the court diary which shall\ninclude all the information as specified in GSTAT CDR-02 maintained by him.\n111. Transmission of order by the Court officer. - (1) The Court officer shall immediately\non pronouncement of order, transmit the order with the case file to the Deputy Registrar or\nAssistant Registrar.\n(2) On receipt of the order from the Court officer, the Deputy Registrar or Assistant Registrar\nshall after due scrutiny, satisfy himself that the provisions of these rules have been duly\ncomplied with and in token thereof affix his initials with date on the outer cover of the order.\n(3) The Deputy Registrar or Assistant Registrar shall thereafter cause to transmit the case file\nand the order to the Registrar for taking steps to prepare copies and their communication to\nthe parties.\n112. Format of order. - (1) All orders shall be neatly and fairly typewritten in double space\non one side only on durable foolscap folio paper of metric A-4 size (30.5 cm long and 21.5\ncm wide) with left side margin of 5 cm and right-side margin of 2.5 cm. Corrections, if any,\nin the order shall be carried out neatly and sufficient space may be left both at the bottom and\nat the top of each page of the order to make its appearance elegant.\n(2) Members constituting the Bench shall affix their signatures in the order of their seniority\nfrom right to left.\n113. Indexing of case files after disposal. - After communication of the order to the parties\nor authorised representative, the official concerned shall arrange the records with pagination\nand prepare in the Index Sheet in Format prescribed by the Appellate Tribunal. He shall affix\ninitials and then transmit the records with the Index initials to the records room.\n\n114. Copies of orders in library. - (1) The officer in charge of the Registry shall send copies\nof every final order to the library of the Appellate Tribunal.\n(2) Copies of all orders received in each month shall be kept at the library in a separate\nfolder, arranged in the order of date of pronouncement, duly indexed and stitched.\n(3) At the end of every year, a consolidated index shall also be prepared and kept in a\nseparate file in the library.\n(4) The order folders and the indices may be made available for reference in the library to the\nauthorised representative.\n",
    "tags": "GSTAT, Chapter XIII, disposal, order, pronouncement, Rule 99, stay, costs, remand",
    "is_global": true
  },
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "Chapter IX — Rules 72-77",
    "title": "GSTAT Rules 2025 — Chapter IX: Appearance of Authorised Representative",
    "full_text": "CHAPTER IX:\nAppearance of authorised representative\n72. Appearance of authorised representative. – Subject to as hereinafter provided, no legal\npractitioner or authorised representative shall be entitled to appear and act, in any proceeding\nbefore the Appellate Tribunal unless he files into Appellate Tribunal vakalatnama or\nMemorandum of Appearance or letter of authorisation which shall include all the information\nas specified in GSTAT FORM-04 as the case may, duly executed by or on behalf of the party\nfor whom he appears.\n73. Consent for engaging or change of authorised representative (Duly stamped as per\nthe respective High Court rules). – A legal practitioner or authorised representative\nproposing to file a Vakalatnama or Memorandum of Appearance or letter of authorisation, as\nthe case may be, in any pending case or proceeding before the Appellate Tribunal in which\nthere is already a legal practitioner or authorised representative on record, shall do so only\nwith the written consent of the legal practitioner or the authorised representative on record or\nwhen such consent is refused, with the permission of the Appellate Tribunal after revocation\nof Vakalatnama or Memorandum of Appearance, as the case may be, on an application filed\nin this behalf, which shall receive consideration only after service of such application on the\ncounsel already on record:\nProvided that such consent shall not be required in case of application filed under sub-\nsection 3 of section 112 of the Act.\n74. Restrictions on appearance. – A legal practitioner or the authorised representative, as\nthe case may be, who has tendered advice in connection with the institution of any case or\nother proceeding before the Appellate Tribunal or has drawn pleadings in connection with\nany such matter or has during the progress of any such matter acted for a party, shall not,\nappear in such case or proceeding or other matter arising there from or in any matter\nconnected therewith for any person whose interest is opposed to that of his former client,\nexcept with the prior permission of the Appellate Tribunal.\n75. Restriction on party’s right to be heard. – The party who has engaged a legal\npractitioner or authorised representative to appear for him before the Appellate Tribunal may\nbe restricted by the Appellate Tribunal in making presentation before it.\n76. Empanelment of special authorised representatives by the Appellate Tribunal. – (1)\nThe Appellate Tribunal may draw up a panel of authorised representatives or valuers or such\nother experts as may be required by the Appellate Tribunal to assist in proceedings before the\nAppellate Tribunal.\n(2) The Appellate Tribunal may call upon any of the persons from panel under sub-rule (1)\nfor assistance in the proceedings before the Bench, if so required.\n(3) The remuneration payable and other allowances and compensation admissible to such\npersons shall be specified in consultation with the Appellate Tribunal.\n\n77. Professional dress for the authorised representatives. – While appearing before the\nAppellate Tribunal, the authorised representatives shall wear the same professional dress as\nprescribed in their Code of Conduct.\n",
    "tags": "GSTAT, Chapter IX, advocate, CA, authorised representative, appearance, Rule 72, vakalatnama",
    "is_global": true
  },
  {
    "ref_type": "rule",
    "act_name": "GSTAT Procedure Rules 2025",
    "reference_no": "Chapter XV — Rules 116+ with Forms",
    "title": "GSTAT Rules 2025 — Chapter XV: Miscellaneous + Official Forms (APL-01, APL-05)",
    "full_text": "CHAPTER XV\nMiscellaneous\n116. Register of appeals, petitions, etc.- (1) A Register in prescribed GSTAT CDR--07 and\n08 shall be maintained in regard to appeals, petitions, etc., against the orders of the Appellate\nTribunal to the Hon‘ble Supreme Court and Hon‘ble High Courts and necessary entries\ntherein be promptly made by the judicial branch.\n(2) The register shall be placed for scrutiny by the President or Vice-President, as the case\nmay be, in the first week of every month.\n117. Placing of order of Hon’ble Supreme Court and Hon’ble High Courts before the\nAppellate Tribunal. – Whenever an interim or final order passed by the Hon‘ble Supreme\nCourt or Hon‘ble High Courts in an appeal or other proceeding preferred against a decision\nof the Appellate Tribunal is received, the same shall forthwith be placed before the President\nand same Bench of Members for information and kept in the relevant case file and immediate\nattention of the Registrar shall be drawn to the directions requiring compliance.\n118. Registrar to ensure compliance of Hon’ble Supreme Court or Hon’ble High Courts\norders. – It shall be the duty of the Registrar to take expeditious steps to comply with the\ndirections of the Hon‘ble Supreme Court/Hon‘ble High Courts in matters pertaining to the\nAppellate Tribunal.\n119. Fees. — (1) In respect of the several matters, there shall be paid fees as prescribed in the\nSchedule of Fees appended to these rules:\nProvided that no fee shall be payable or shall be liable to be collected on a petition or\napplication filed or reference made by any departmental authority connected with a matter in\nquestion before the Appellate Tribunal.\n(2) In respect of every interlocutory application, there shall be paid fees as prescribed in\nSchedule of Fees of these rules:\nProvided that no fee shall be payable or shall be liable to be collected on a petition or\napplication filed or reference made by any departmental authority connected with a matter in\nquestion before the Appellate Tribunal.\n(3) In respect of a petition or appeal or application filed or references made before the\nPrincipal Bench or the Bench of the Appellate Tribunal, fees referred to in this Part shall be\npaid on GSTAT portal in the manner provided thereon.\n120. Award of costs in the proceedings. — (1) Whenever the Appellate Tribunal deems fit,\nit may award cost for meeting the legal expenses of the respondent of defaulting party.\n(2) The Appellate Tribunal may in suitable cases direct appellant or respondent to bear the\ncost of litigation of the other side, and in case of abuse of process of court, impose exemplary\ncosts on defaulting party.\n\n121. Dress for the Members. — The dress for the Members shall be such as the President\nmay prescribe.\n122. Dress for the parties. — Every authorised representative other than a relative or regular\nemployee of a party shall appear before the Appellate Tribunal in his professional dress, if\nany, and, if there is no such dress —\n(a) if a male, in a close-collared black coat, or in an open-collared black coat, with\nwhite shirt and black tie; or\n(b) if a female, in a black coat over a white sari or any other white dress:\nProvided that during the summer season from the 15th April to 31st August, the\nauthorised representatives may, when appearing before a Bench of the Appellate Tribunal,\ndispense with the wearing of a black coat.\nExplanation. - For the purpose of this rule, the expression, ―regular employee of a party‟\nshall not include a departmental officer who is appointed as an authorised representative.\n123. Removal of difficulties and issuance of directions. - Notwithstanding anything\ncontained in the rules, wherever the rules are silent or no provisions have been made, the\nPresident may issue appropriate directions to remove difficulties and issue such orders or\ncirculars to govern the situation or contingency that may arise in the working of the Appellate\nTribunal.\n124. Inspection of the State Benches. – The President, or any Judicial or Technical Member\nof the Principal Bench, nominated by the President, shall have the authority to inspect the\noffice and proceedings of the State Benches, as per procedure and rules for travel and\ninspection as decided by the President.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 59\nGSTAT FORM -01\n[See rule 29 and 49]\nInterlocutory Application to the Appellate Tribunal\n1. GSTIN or Temporary Identification or Unique Identification Number –\n2. Name of the appellant/applicant/respondent –\n3. Address of the appellant/applicant/respondent –\n4. Original Appeal Number- Date-\n5. Date of last hearing –\n6. Name of the representative –\n7. Purpose of the Interlocutory application –\n8. Whether the appellant or applicant or respondent wishes to be heard in person -\n9. Statement of facts -\n10. Grounds of application -\n11. Prayer -\nPlace:\nDate:\nSignature\nName of the appellant or applicant or respondent\nDesignation or Status\n\nGSTAT FORM -02 - ORDER SHEET\n[See rule 54]\n(in Appeal)\nNo........................................ Registrar\nAppellate Tribunal\n(Appellant) Vs (Respondent)\n------------------------------------------------------------------------------------------\nSl. No., or Brief order, mentioning How complied\nOrder and date Reference, if necessary with and date of\ncompliance\n------------------------------------------------------------------------------------------\n1. Form of Appeal presented by hand or\nreceived by post or online from Appellant\non...........................has been registered.\nIt is in order .........................\nIt is not in order for the reasons stated.\n1.\n2.\n3.\n4.\nFor Deputy Registrar\nor Assistant Registrar\n2. A copy of Order be\nsent to the respondent or appellant\nFor Deputy Registrar\nor Assistant Registrar\nDispatched on.........\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 61\nFormat of Indexing\n[See rule 66 and 113]\n1. Appeal No.-\n2. Appellants‘ Name(s), (GSTIN, if any) and Address –\n3. Respondent name(s), (GSTIN, if any) and Address –\n4. No. of Order in Appeal –\n5. Period of dispute –\n6. Section under which original order passed –\n7. State Jurisdiction –\n8. Bench to which assigned and whether single member case-\n9. Name of Members -\n10. Date of Hearings -\n11. Interim Order, if any with date –\n12. Date of final appeal order -\n13. Nature of order allowed, partly allowed or dismissed –\n14. Remarks –\n\nGSTAT FORM-03 - INSPECTION\n[See rule 67]\nApplication to the Registrar for inspection of records\n1. GSTIN/ Temporary Identification /Unique Identification Number –\n2. Name of the appellant –\n3. Address of the appellant –\n4. Original Appeal/Order Number - Date-\n5. Grounds of inspection –\n6. Purpose of inspection –\n7. Details of payment -\n8. Detail of documents for inspection –\n(i) ………..\n(ii) ………..\n(iii) ……………\n9. Remarks, if any -\nPlace:\nDate:\nSignature\n(Name of the Applicant)\nDesignation or Status.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 63\nSCHEDULE OF\nFEES\nS.No. Relevant Nature of application / petition Fees\nSection/Rules\n1. Rule 67 of GSTAT Application for Inspection of Records Rs.5000\nProcedural Rules\n2025\n2. Rule 118(2) of Interlocutory Applications Rs.5000\nGSTAT procedural\nRules 2025\n3. Rule 110(5) of Appeals to GSTAT As per\nCGST/SGST/UTGST rule\nRules 2017\n4. Application under any other provisions specifically not mentioned herein above Rs.5000\n5. Fee for obtaining certified true copy of final order passed to parties other than the Rs.5 per\nconcerned parties under Rule page\n\nGSTAT FORM-04\n(see rule 72)\nMemorandum of appearance\nTo\nThe Registrar,\nThe Goods and Services Tax Appellate Tribunal\nIn the matter of …………. Petitioner.\nVs.\n………………..Respondent\n(Appeal No. ………of 20………)\nSir,\nPlease take notice that I, …….., authorised representative/ practising Chartered\nAccountant/practising Cost Accountant/ legal practitioner, duly authorised to enter\nappearance, and do hereby enter appearance, on behalf of …………….. petitioner/\nrespondent/ Registrar/ Government of ………………….. in the above-mentioned petition.\n*A copy of the authorisation/vakalatnama issued by the Appellant or Respondent authorising\nme to enter appearance and to act for every purpose connected with the proceedings for the\nsaid party is enclosed, duly signed by me for identification.\nYours sincerely,\nDated ………. day of ……………\nAddress:\nEnclosure: as aforesaid Tele No.:\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 65\nGSTAT FORM-05\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\n[See rule 6 and 81]\n(Certification when deponent is unacquainted with the language of the affidavit or is blind or\nilliterate)\nContents of the affidavit were truly and audibly read over/translated into ………...............\nlanguage known to the deponent and he seems to have understood the same and affixed his\nLeft Thumb Impression/Signature/Mark.\n(Signature)\nName and designation with date.\n\nGSTAT FORM-06 - SUMMONS\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\n[See rule 84(3)]\nTo,\n…………\nWhereas the Appellate Tribunal suo motu or on consideration of the request made by Shri/\nSmt/ M/s …………………..(Appellant/Respondent) having been satisfied that production of\nthe following documents or records under your control or custody is necessary for proper\ndecision of the above case, you are hereby directed to cause production of the said\ndocuments/records before this Tribunal /forward duly authenticated copies thereof on or\nbefore the …………………day of…..20………\n(Enter description of documents requisitioned)\n―By Order of Appellate Tribunal‖\nRegistrar.\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 67\nGSTAT FORM-07\n[See rule 93]\nBEFORE THE GOODS AND SERVICES TAX APPELLATE TRIBUNAL\nAppeal No…………… of 20……………\nDeposition of Petitioner’s Witness or Respondent’s Witness\n1. Name :\n2. Father‘s/Mother‘s/Husband‘s Name :\n3. Age :\n4. Occupation :\n5. Place of Residence and address :\n6. Name of the Officer administering the\nOath / affirmation :\n7. Name of the Interpreter if any, duly\nSworn/ solemnly affirmed :\nDuly sworn/ solemnly/ affirmed\nExamination-in-chief: By\nDate:\n…………………………………………………………………….\nCross-examination: By\n……………………………………………………………………\nRe-examination, if any:\n……………………………………………………………………\n(Signature of the witness on each page)\nStatement of witness as recorded was read over/translated to the witness, who admitted it to\nbe correct.\nSignature of the Member of the Appellate Tribunal with date.\n\nGSTAT FORM-08\n[See rule 95]\nCERTIFICATE OF DISCHARGE\nCertified that …………………………………………… appeared before this Appellate\nTribunal as a witness/in/Appeal No. …………………………..of 20……, on behalf of the\nappellant or respondent as Court witness on this ……………day of ….20…… and that he\nwas relieved at ………………….on…………………… He was paid/not paid any T.A. and\nD.A. or allowance of Rs……………….\nSignature of the Registrar\n(Seal of the Appellate Tribunal).\nDate :\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 69\nCAUSE LIST- GSTAT CDR-01\n[See rule 38]\nDate:\nSl.No. Court Name of Appeal Interlocutory Purpose Section Name Name of Name of Remarks\nNo. the No. Application or of AR for counsel for\nand Members Main Parties Petitioner Respondent\nTime Application or\nAppellant\n\nGSTAT CDR -02 - COURT DIARY\n[See rule and 53 and 110]\nSl. Appeal Appellant or Time at Time Time at Time Whether If not, Whether Whether order Whether Initials Remarks\nNo. No. Respondent which at which at the Member the is reserved, if matter is of\nsitting of which Bench re- which judgement to whom matter is so, the date of adjourned Gazetted\nBench the assembled the is dictated the case part- pronouncement with date Officer\ncommenced Bench Bench in the is heard, if of the order then the\nrose finally open assigned so the next date\nfor rose court, if so for next of hearing\nlunch for the by which passing date\nbreak day Member the order given\nand Which for\nSPS or PA hearing\ntook\ndictation\n1 2 3 4 5 6 7 8 9 10 11 12 13 14\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 71\nGSTAT-CDR -03 - Register of Provisional Appeals\n[See rule 59(a)]\nSl. Prov. Appellants‘ Respondent No. of State Appeal Payment of fee Remarks\nNo. Appeal Name(s) and name(s) and Order in Jurisdiction accepted or\nNo. Address Address Appeal rejected with\ndate\n1 2 3 4 5 6 7 8 9\nGSTAT- CDR -04- Register of Appeals\n[See rule 59(b)]\nSl. Appeal Appellants‘ Respondent No. of Period of Section State Bench to Interim Date of Nature of Remarks\nNo. No. Name(s) and name(s) and Order in dispute under Jurisdiction which Order, if final order\nAddress Address Appeal which assigned and any with appeal allowed,\noriginal whether date order partly\norder single allowed or\npassed member case dismissed\n1 2 3 4 5 6 7 8 9 10 11 12 13\nGSTAT-CDR -05 - Register of Interlocutory Appeals\n[See rule 59(c)]\nSl. Original No. of Appellants‘ Respondent Bench for Date of Order- whether Remarks\nNo. Appeal Interlocutory Name(s) and Name(s) and which order in allowed or\nNo. Appeal Address Address application/ interlocutory dismissed, with\nappeal filed application date\n1 2 3 4 5 6 7 8 9\n\nGSTAT-CDR -06- Register of Inspection\n[See rule 71 ]\nSl. No. of Name of No. of Appeal Application Payment of Fee Date of Signature of the Inspection Remarks\nNo. Application Applicant and related, if any dismissed or Inspection and applicant Supervisory\nwith date Address allowed with date conclusion Officer\n1 2 3 4 5 6 7 8 9\n\n[भाग II—खण्‍ड 3(i)] भारत‍का‍राजपत्र‍:‍असाधारण 73\nGSTAT CDR - 07-SUPREME COURT\n[See rule 116]\nCourt No. of No. of Name of the Date of Date of receipt Appeal Interim Final order Direction Steps Remarks\nNo. Appeal Order in Applicant or dispatch of records at dismissed or Direction\nBefore the Appeal Respondent of records to GSTAT allowed with If any, in the If any, for Taken for\nGSTAT GSTAT date with date appeal with compliance compliance\ndate by the\nAppellate\nTribunal\n1 2 3 4 5 6 7 8 9 10 11 12\nGSTAT CDR -08 – HIGH COURT\n[See rule 116]\nCourt No. No. of No. of Name of the Date of Date of Appeal Interim Final Direction Steps Remarks\nAppeal Order in Applicant or dispatch receipt of dismissed or Direction order\nBefore the Appeal Respondent of records to records at allowed with If any, If any, for Taken for\nGSTAT GSTAT GSTAT date with date in the compliance by compliance\nappeal the Appellate\nwith date Tribunal\n1 2 3 4 5 6 7 8 9 10 11 12\n[F. No. A-50050/264/2024-GSTAT-DoR]\nS.S.SHARDOOL, Registrar GST Appellate Tribunal\nUploaded by Dte. of Printing at Government of India Press, Ring Road, Mayapuri, New Delhi-110064\nand Published by the Controller of Publications, Delhi-110054.",
    "tags": "GSTAT, Chapter XV, forms, APL-01, APL-02, APL-05, vakalatnama, affidavit, Rule 116",
    "is_global": true
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// LEGAL LIBRARY
// ══════════════════════════════════════════════════════════════════════════════

function LegalLibrary({token,toast,isAdmin}){
  const C=getC();const S=getS();
  const[refs,setRefs]=useState([]);const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");const[filterType,setFilterType]=useState("");
  const[page,setPage]=useState(1);const[total,setTotal]=useState(0);
  const[modal,setModal]=useState(null);const[viewing,setViewing]=useState(null);
  const[tab,setTab]=useState("paste"); // paste | pdf
  const[f,setF]=useState({ref_type:"act_section",act_name:"",reference_no:"",title:"",full_text:"",court_name:"",case_citation:"",case_date:"",jurisdiction:"",tags:"",is_global:true});
  const[pdfFile,setPdfFile]=useState(null);const[saving,setSaving]=useState(false);

  const load=useCallback(()=>{setLoading(true);
    api(`/legal-refs?search=${encodeURIComponent(search)}&ref_type=${filterType}&page=${page}&limit=30`,"GET",null,token)
      .then(d=>{setRefs(d.refs||[]);setTotal(d.total||0);setLoading(false);}).catch(()=>setLoading(false));
  },[token,search,filterType,page]);
  useEffect(()=>{load();},[load]);

  const openRef=async id=>{try{const d=await api(`/legal-refs/${id}`,"GET",null,token);setViewing(d.ref);}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete this reference?"))return;
    try{await api(`/legal-refs/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  const savePaste=async()=>{
    if(!f.ref_type||!f.title||!f.full_text)return toast("Type, title and text required","error");
    setSaving(true);
    try{await api("/legal-refs","POST",f,token);toast("✅ Reference saved","success");setModal(null);load();}
    catch(e){toast(e.message,"error");}setSaving(false);
  };
  const savePdf=async()=>{
    if(!pdfFile||!f.ref_type||!f.title)return toast("File, type and title required","error");
    setSaving(true);
    try{
      const fd=new FormData();fd.append("file",pdfFile);fd.append("ref_type",f.ref_type);fd.append("title",f.title);
      fd.append("act_name",f.act_name||"");fd.append("reference_no",f.reference_no||"");
      fd.append("court_name",f.court_name||"");fd.append("case_citation",f.case_citation||"");
      fd.append("case_date",f.case_date||"");fd.append("jurisdiction",f.jurisdiction||"");
      fd.append("tags",f.tags||"");fd.append("is_global",isAdmin&&f.is_global?"true":"false");
      const d=await apiUpload("/legal-refs/upload",fd,token);
      toast(`✅ Saved! ${d.extracted_length?d.extracted_length.toLocaleString()+" characters extracted":d.message||"Reference added"}`,"success");
      setModal(null);setPdfFile(null);load();
    }catch(e){
      const msg=e.message||"";
      if(msg.includes("Scanned")||msg.includes("scanned")||msg.includes("image PDF")||msg.includes("No readable")||msg.includes("not possible")){
        toast("❌ Scanned PDF detected — text extraction failed. Please switch to Paste Text tab and paste the content manually.","error");
      }else if(msg.includes("password")||msg.includes("Password")){
        toast("❌ Password-protected PDF. Remove password first, then upload.","error");
      }else{
        toast("❌ Upload failed: "+msg,"error");
      }
    }
    setSaving(false);

  };

  const isCase=t=>["hc_order","sc_order","gstat_order","aar"].includes(t);

  if(viewing)return(<div>
    <button onClick={()=>setViewing(null)} style={{...S.btnO,marginBottom:14,fontSize:12}}>← Library</button>
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:4}}>{viewing.title}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {badge(REF_TYPES.find(r=>r[0]===viewing.ref_type)?.[1]||viewing.ref_type,REF_COLORS[viewing.ref_type]||"blue")}
            {viewing.is_global&&badge("Global Library","green")}
          </div>
        </div>
        {(isAdmin||!viewing.is_global)&&<button onClick={()=>del(viewing.id)} style={{...S.btnR,fontSize:11}}>🗑 Delete</button>}
      </div>
      {isCase(viewing.ref_type)?(<div style={{...S.card,background:"#f8fafc",marginBottom:12}}>
        <div style={S.col2}>
          <div><span style={S.label}>Court</span><div style={{fontWeight:600}}>{viewing.court_name||"—"}</div></div>
          <div><span style={S.label}>Citation</span><div style={{fontWeight:600,fontFamily:"monospace"}}>{viewing.case_citation||"—"}</div></div>
          <div><span style={S.label}>Date</span><div>{fD(viewing.case_date)}</div></div>
          <div><span style={S.label}>Jurisdiction</span><div>{viewing.jurisdiction||"—"}</div></div>
        </div>
      </div>):(<div style={{...S.card,background:"#f8fafc",marginBottom:12}}>
        <div style={S.col2}>
          <div><span style={S.label}>Act / Source</span><div style={{fontWeight:600}}>{viewing.act_name||"—"}</div></div>
          <div><span style={S.label}>Reference No.</span><div style={{fontFamily:"monospace"}}>{viewing.reference_no||"—"}</div></div>
        </div>
      </div>)}
      {viewing.tags&&<div style={{marginBottom:10}}><span style={S.label}>Tags</span><div style={{fontSize:12,color:C.sub}}>{viewing.tags}</div></div>}
      <div><span style={S.label}>Full Text ({(viewing.full_text||"").length.toLocaleString()} chars)</span></div>
      {/* Font Controls */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10,padding:"8px 12px",background:C.bg,borderRadius:6,border:`1px solid ${C.border}`,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:600}}>Font:</span>
        {[["Serif","Georgia,'Times New Roman',serif"],["Sans","Arial,sans-serif"],["Mono","monospace"]].map(([l,f])=>(
          <button key={l} onClick={()=>setViewFont(f)} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${viewFont===f?"#0B6623":C.border}`,background:viewFont===f?"#f0fdf4":"#fff",color:viewFont===f?"#0B6623":C.muted,cursor:"pointer",fontSize:11,fontFamily:f}}>A {l}</button>
        ))}
        <span style={{fontSize:11,color:C.muted,fontWeight:600,marginLeft:8}}>Size:</span>
        {[["S",11],["M",13],["L",15]].map(([l,sz])=>(
          <button key={l} onClick={()=>setViewSize(sz)} style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${viewSize===sz?"#0B6623":C.border}`,background:viewSize===sz?"#f0fdf4":"#fff",color:viewSize===sz?"#0B6623":C.muted,cursor:"pointer",fontSize:11}}>{l}</button>
        ))}
        <button onClick={()=>navigator.clipboard.writeText(viewing.full_text||"").then(()=>alert("✅ Copied!"))} style={{...S.btnO,fontSize:10,padding:"3px 10px",marginLeft:"auto"}}>📋 Copy All</button>
      </div>
      <div style={{background:"#fff",color:"#1a1a1a",border:"1px solid #d0d7de",borderRadius:6,padding:18,maxHeight:560,overflowY:"auto",fontSize:viewSize||13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:viewFont||"Georgia,'Times New Roman',serif",marginTop:6,boxShadow:"inset 0 1px 4px rgba(0,0,0,0.04)"}}>
        {viewing.full_text}
      </div>
    </div>
  </div>);

  return(<div>
    <div style={{...S.card,background:"#f0fdf4",border:`1px solid #86efac`,marginBottom:14}}>
      <div style={{fontWeight:700,color:"#166534",marginBottom:3}}>📚 Legal Library</div>
      <div style={{fontSize:12,color:"#166534"}}>
        {isAdmin?"Admin: You can upload Global references visible to all users. Users can also upload their own private references.":"Browse global library references. Upload your own private references. AI will cite ONLY from references stored here."}
      </div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="🔍 Search by title, section, keyword…" style={{...S.input,maxWidth:280}}/>
      <select style={{...S.select,width:200}} value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(1);}}>
        <option value="">All Types</option>
        {REF_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <button onClick={()=>setModal("add")} style={{...S.btn,marginLeft:"auto"}}>+ Add Reference</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{total} references found</div>
        {refs.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>
          {search||filterType?"No references match your filter":"Library is empty. Add references to enable AI citations."}
        </div>:(
          <table style={S.tbl}><thead><tr>
            {["Type","Title / Reference","Source / Citation","Size","Global",""].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{refs.map(r=>(
            <tr key={r.id} style={{cursor:"pointer"}} onClick={()=>openRef(r.id)}>
              <td style={S.td}>{badge(REF_TYPES.find(t=>t[0]===r.ref_type)?.[1]||r.ref_type,REF_COLORS[r.ref_type]||"blue")}</td>
              <td style={{...S.td,maxWidth:250}}>
                <div style={{fontWeight:600,fontSize:12}}>{r.title}</div>
                {r.reference_no&&<div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{r.act_name} {r.reference_no}</div>}
              </td>
              <td style={{...S.td,fontSize:11}}>{isCase(r.ref_type)?`${r.court_name||"—"} | ${r.case_citation||"—"}${r.jurisdiction?" ("+r.jurisdiction+")":""}`:r.act_name||"—"}</td>
              <td style={{...S.td,fontSize:11}}>{r.text_length?`${Math.round(r.text_length/1000)}k chars`:"—"}</td>
              <td style={S.td}>{r.is_global?badge("Global","green"):badge("Private","gray")}</td>
              <td style={S.tdR} onClick={e=>e.stopPropagation()}>
                {(isAdmin||!r.is_global)&&<button onClick={()=>del(r.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button>}
              </td>
            </tr>
          ))}</tbody></table>
        )}
        {total>30&&<div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={S.btnO}>← Prev</button>
          <span style={{fontSize:12,color:C.muted,alignSelf:"center"}}>Page {page}</span>
          <button onClick={()=>setPage(p=>p+1)} disabled={refs.length<30} style={S.btnO}>Next →</button>
        </div>}
      </div>
    )}
    {/* Edit Modal */}
    {modal==="edit"&&editRef&&(<Modal title="Edit Reference" onClose={()=>{setModal(null);setEditRef(null);}} wide>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Reference Type</label>
          <select style={S.select} value={editRef.ref_type} onChange={e=>setEditRef(p=>({...p,ref_type:e.target.value}))}>
            {REF_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={S.fg}><label style={S.label}>Title *</label><input style={S.input} value={editRef.title||""} onChange={e=>setEditRef(p=>({...p,title:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Act / Source</label><input style={S.input} value={editRef.act_name||""} onChange={e=>setEditRef(p=>({...p,act_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Reference No.</label><input style={S.input} value={editRef.reference_no||""} onChange={e=>setEditRef(p=>({...p,reference_no:e.target.value}))}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>Tags (keywords)</label><input style={S.input} value={editRef.tags||""} onChange={e=>setEditRef(p=>({...p,tags:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Full Text *</label>
        <textarea style={{...S.input,minHeight:200,fontFamily:"Georgia,serif",fontSize:12,lineHeight:1.7}} value={editRef.full_text||""} onChange={e=>setEditRef(p=>({...p,full_text:e.target.value}))}/>
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{(editRef.full_text||"").length.toLocaleString()} characters</div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>{setModal(null);setEditRef(null);}} style={S.btnO}>Cancel</button>
        <button onClick={async()=>{
          if(!editRef.title||!editRef.full_text)return toast("Title and text required","error");
          try{
            await api(`/legal-refs/${editRef.id}`,"PUT",{...editRef},token);
            toast("✅ Reference updated","success");
            setModal(null);setViewing(null);setEditRef(null);load();
          }catch(e){toast(e.message,"error");}
        }} style={S.btn}>💾 Save Changes</button>
      </div>
    </Modal>)}

    {/* Bulk Import Modal */}
    {modal==="bulk"&&(<Modal title="📥 Bulk Import — GSTAT Procedure Rules 2025" onClose={()=>setModal(null)} wide>
      <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:6,padding:12,marginBottom:14,fontSize:12,color:"#166534"}}>
        ✅ GSTAT Procedure Rules 2025 (G.S.R. 256(E) dated 24-Apr-2025) — 6 entries ready to import including Chapter III (Appeal Filing Procedure), Chapter V (Hearing), Chapter XIII (Orders) and complete text.
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>This will add 6 library entries from the GSTAT Procedure Rules 2025. All will be marked as Global (visible to all users).</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button>
        <button onClick={async()=>{
          try{
            const entries=GSTAT_RULES_2025_ENTRIES;
            const d=await api("/legal-refs/bulk-import","POST",{refs:entries},token);
            toast(d.message,"success");setModal(null);load();
          }catch(e){toast(e.message,"error");}
        }} style={S.btn}>📥 Import All 6 Entries →</button>
      </div>
    </Modal>)}

    {modal==="add"&&(<Modal title="Add Legal Reference" onClose={()=>setModal(null)} wide>
      <div style={{display:"flex",gap:0,background:"#f0f2f5",borderRadius:6,padding:4,marginBottom:16}}>
        {[["paste","✏️ Paste Text"],["pdf","📄 Upload PDF"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px",border:"none",borderRadius:5,
            background:tab===k?"#fff":"transparent",color:tab===k?C.navy:C.muted,
            cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===k?700:400}}>
            {l}</button>
        ))}
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Reference Type *</label>
          <select style={S.select} value={f.ref_type} onChange={e=>setF(p=>({...p,ref_type:e.target.value}))}>
            {REF_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {isAdmin&&<div style={S.fg}><label style={S.label}>Visibility</label>
          <select style={S.select} value={f.is_global?"global":"private"} onChange={e=>setF(p=>({...p,is_global:e.target.value==="global"}))}>
            <option value="global">🌐 Global (all users)</option>
            <option value="private">🔒 Private (only me)</option>
          </select>
        </div>}
      </div>
      <div style={S.fg}><label style={S.label}>Title *</label><input style={S.input} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder="e.g. Section 16 - Eligibility and conditions for ITC"/></div>
      {isCase(f.ref_type)?(<>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>Court / Forum</label><input style={S.input} value={f.court_name} onChange={e=>setF(p=>({...p,court_name:e.target.value}))} placeholder="e.g. Delhi High Court"/></div>
          <div style={S.fg}><label style={S.label}>Citation</label><input style={S.input} value={f.case_citation} onChange={e=>setF(p=>({...p,case_citation:e.target.value}))} placeholder="e.g. 2024 (3) GST 456"/></div>
        </div>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={f.case_date} onChange={e=>setF(p=>({...p,case_date:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Jurisdiction (HC state)</label><input style={S.input} value={f.jurisdiction} onChange={e=>setF(p=>({...p,jurisdiction:e.target.value}))} placeholder="e.g. Delhi, Allahabad, Bombay"/></div>
        </div>
      </>):(<div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Act / Source Name</label><input style={S.input} value={f.act_name} onChange={e=>setF(p=>({...p,act_name:e.target.value}))} placeholder="e.g. CGST Act 2017"/></div>
        <div style={S.fg}><label style={S.label}>Section / Rule / No.</label><input style={S.input} value={f.reference_no} onChange={e=>setF(p=>({...p,reference_no:e.target.value}))} placeholder="e.g. Section 16 / Rule 36 / Circular 31/2018"/></div>
      </div>)}
      <div style={S.fg}><label style={S.label}>Tags (comma-separated keywords)</label><input style={S.input} value={f.tags} onChange={e=>setF(p=>({...p,tags:e.target.value}))} placeholder="ITC, reversal, mismatch, Section 16"/></div>
      {tab==="paste"?(<>
        <div style={S.fg}><label style={S.label}>Full Text * (paste the complete text)</label>
          <textarea style={{...S.input,minHeight:200,fontFamily:"monospace",fontSize:11}} value={f.full_text} onChange={e=>setF(p=>({...p,full_text:e.target.value}))} placeholder="Paste the complete text of the Act section, Rule, Circular, Court order, or Judgment…"/>
          {f.full_text&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{f.full_text.length.toLocaleString()} characters</div>}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={savePaste} disabled={saving} style={S.btn}>{saving?"Saving…":"Save Reference"}</button></div>
      </>):(<>
        <div style={S.fg}><label style={S.label}>Upload PDF *</label>
          <label style={{...S.btnO,display:"inline-block",cursor:"pointer",padding:"10px 16px"}}>{pdfFile?`✅ ${pdfFile.name}`:"📁 Choose PDF"}<input type="file" accept=".pdf" onChange={e=>setPdfFile(e.target.files[0])} style={{display:"none"}}/></label>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Text will be auto-extracted from the PDF. For scanned PDFs, paste text manually instead.</div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={savePdf} disabled={saving||!pdfFile} style={{...S.btn,opacity:!pdfFile?0.5:1}}>{saving?"Extracting & Saving…":"Upload & Extract"}</button></div>
      </>)}
    </Modal>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// APPEAL MANAGER — wraps AppealList + AppealWorkspace
// ══════════════════════════════════════════════════════════════════════════════
function AppealManager({token,toast,go}){
  const C=getC();const S=getS();
  const[appeals,setAppeals]=useState([]);const[loading,setLoading]=useState(true);
  const[active,setActive]=useState(null);
  const[cases,setCases]=useState([]);

  const load=useCallback(()=>{setLoading(true);api("/appeals","GET",null,token).then(d=>{setAppeals(d.appeals||[]);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  useEffect(()=>{load();api("/cases","GET",null,token).then(d=>setCases(d.cases||[])).catch(()=>{});},[token]);

  const openAppeal=async id=>{try{const d=await api(`/appeals/${id}`,"GET",null,token);setActive(d.appeal);}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete appeal?"))return;try{await api(`/appeals/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  if(active)return<AppealWorkspace token={token} toast={toast} appeal={active}
    onBack={()=>{setActive(null);load();}}
    onRefresh={async()=>{const d=await api(`/appeals/${active.id}`,"GET",null,token);setActive(d.appeal);}}/>;

  return(<div>
    <div style={{...S.card,background:"#f0fdf4",border:"1px solid #86efac",marginBottom:14}}>
      <div style={{fontWeight:700,color:"#166534",marginBottom:3}}>⚖️ Appeal Drafting</div>
      <div style={{fontSize:12,color:"#166534"}}>AI drafts appeals citing ONLY your Legal Library references. Zero hallucination — every [REF-n] is traceable to an uploaded document.</div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14,justifyContent:"flex-end"}}>
      <button onClick={()=>setActive({_isNew:true})} style={S.btn}>+ New Appeal Draft</button>
    </div>
    {loading?<Spinner/>:(appeals.length===0?<div style={{...S.card,textAlign:"center",padding:50}}>
      <div style={{fontSize:48,marginBottom:12}}>⚖️</div>
      <div style={{fontWeight:700,color:C.text,marginBottom:6}}>No appeal drafts yet</div>
      <div style={{color:C.muted,fontSize:12,marginBottom:20}}>Upload impugned orders, fill in the facts & grounds, then AI drafts the appeal with citations from your Legal Library</div>
      <button onClick={()=>setActive({_isNew:true})} style={S.btn}>+ Start First Appeal Draft</button>
    </div>:(
      <div style={S.card}>
        <table style={S.tbl}><thead><tr>
          {["Case No.","Client","Forum","Order Ref","Demand","Refs Cited","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{appeals.map(a=>(
          <tr key={a.id} style={{cursor:"pointer"}} onClick={()=>openAppeal(a.id)}>
            <td style={{...S.td,fontSize:11,fontWeight:600,color:C.green}}>{a.case_number}</td>
            <td style={{...S.td,fontSize:12}}>{a.client_name}</td>
            <td style={{...S.td,fontSize:11}}>{(a.appeal_to||"").replace("GST Appellate Tribunal","GSTAT")}</td>
            <td style={{...S.td,fontSize:11}}>{a.order_ref_no||"—"}</td>
            <td style={{...S.td,fontWeight:600}}>{fR(a.demand_amount)}</td>
            <td style={S.td}>{a.references_used?.length>0?badge(`${a.references_used.length} refs`,"green"):badge("No refs","amber")}</td>
            <td style={S.td}>{badge(a.status,a.status==="filed"?"green":a.status==="reviewed"?"blue":"amber")}</td>
            <td style={S.tdR} onClick={e=>e.stopPropagation()}><button onClick={()=>del(a.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
          </tr>
        ))}</tbody></table>
      </div>
    ))}
  </div>);
}

// ── AppealWorkspace (5 Steps) ─────────────────────────────────────────────────

function AppealWorkspace({token,toast,appeal,onBack,onRefresh}){
  const C=getC();const S=getS();
  const[step,setStep]=useState(appeal._isNew?1:appeal.ai_draft?4:2);
  const[appealId,setAppealId]=useState(appeal.id||null);
  const[cases,setCases]=useState([]);
  const[f,setF]=useState({case_id:appeal.case_id||"",appeal_to:appeal.appeal_to||APPEAL_FORUMS[0],order_ref_no:appeal.order_ref_no||"",order_date:appeal.order_date?.substring(0,10)||"",order_type:appeal.order_type||ORDER_TYPES[0],section_invoked:appeal.section_invoked||"",demand_amount:String(appeal.demand_amount||0),tax_period:appeal.tax_period||"",issuing_officer:appeal.issuing_officer||"",jurisdiction:appeal.jurisdiction||""});
  const[facts,setFacts]=useState(appeal.facts_summary||"");
  const[grounds,setGrounds]=useState(appeal.grounds?.length?appeal.grounds:[{ground_no:1,heading:"",text:""}]);
  const[delay,setDelay]=useState(String(appeal.delay_days||0));
  const[condonation,setCondonation]=useState(appeal.condonation_reason||"");
  const[prayer,setPrayer]=useState(appeal.prayer||"Set aside the impugned order in its entirety and grant complete relief to the Appellant.");
  const[annexures,setAnnexures]=useState(appeal.annexures?.length?appeal.annexures:[{label:"Annexure A",description:"Impugned Order"},{label:"Annexure B",description:"Relevant Invoices / Evidence"}]);
  const[orderFile,setOrderFile]=useState(null);const[scanning,setScanning]=useState(false);const[scanResult,setScanResult]=useState(null);
  const[draft,setDraft]=useState(appeal.ai_draft||"");const[refsUsed,setRefsUsed]=useState(appeal.references_used||[]);
  const[generating,setGenerating]=useState(false);const[saving,setSaving]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  useEffect(()=>{api("/cases","GET",null,token).then(d=>setCases(d.cases||[])).catch(()=>{});},[token]);

  const saveStep1=async()=>{if(!f.case_id)return toast("Select a case","error");setSaving(true);
    try{if(appealId){await api(`/appeals/${appealId}`,"PUT",{...f,demand_amount:parseFloat(f.demand_amount)||0},token);toast("✅ Saved","success");setStep(2);}
      else{const d=await api("/appeals","POST",{...f,demand_amount:parseFloat(f.demand_amount)||0},token);setAppealId(d.appeal.id);toast("✅ Appeal created","success");setStep(2);}
    }catch(e){toast(e.message,"error");}setSaving(false);};

  const scanOrder=async()=>{if(!orderFile)return toast("Select a file","error");setScanning(true);
    try{const fd=new FormData();fd.append("file",orderFile);
      const d=await apiUpload(`/appeals/${appealId}/scan-order`,fd,token);
      if(d.success){setScanResult(d.summary);
        if(d.summary){setF(p=>({...p,order_ref_no:p.order_ref_no||d.summary.order_ref_no||"",order_date:p.order_date||d.summary.order_date||"",section_invoked:p.section_invoked||d.summary.section_invoked||"",demand_amount:p.demand_amount==="0"?String(d.summary.demand_amount||0):p.demand_amount,issuing_officer:p.issuing_officer||d.summary.issuing_officer||"",tax_period:p.tax_period||d.summary.tax_period||""}));
          if(d.summary.grounds_of_demand?.length&&grounds.every(g=>!g.text))setGrounds(d.summary.grounds_of_demand.map((g,i)=>({ground_no:i+1,heading:`Ground ${i+1}`,text:g})));
          if(!facts&&d.summary.order_ref_no)setFacts(`Order No. ${d.summary.order_ref_no||"—"} dated ${d.summary.order_date||"—"} passed under ${d.summary.section_invoked||"—"} creating a demand of ₹${(d.summary.demand_amount||0).toLocaleString("en-IN")} for period ${d.summary.tax_period||"—"}.`);
        }
        toast("✅ Order scanned successfully","success");
      }else toast(d.message,"error");
    }catch(e){toast("Scan failed","error");}setScanning(false);};

  const saveStep3=async()=>{setSaving(true);
    try{await api(`/appeals/${appealId}`,"PUT",{...f,demand_amount:parseFloat(f.demand_amount)||0,facts_summary:facts,grounds,delay_days:parseInt(delay)||0,condonation_reason:condonation,prayer,annexures},token);
      toast("✅ Saved","success");setStep(4);}catch(e){toast(e.message,"error");}setSaving(false);};

  const generateDraft=async()=>{setGenerating(true);
    try{const d=await api(`/appeals/${appealId}/generate-draft`,"POST",null,token);
      setDraft(d.draft);setRefsUsed(d.references_used||[]);
      toast(d.grounded?`✅ Draft ready — ${d.ref_count} library references cited!`:"⚠ Draft ready — Legal Library empty (no citations)","success");
    }catch(e){toast(e.message,"error");}setGenerating(false);};

  const saveDraft=async()=>{try{await api(`/appeals/${appealId}`,"PUT",{...f,demand_amount:parseFloat(f.demand_amount)||0,facts_summary:facts,grounds,ai_draft:draft,status:"reviewed"},token);toast("✅ Saved as Reviewed","success");}catch(e){toast(e.message,"error");}};

  const downloadWord=()=>window.open(`${API}/appeals/${appealId}/download?token=${token}`,"_blank");

  const STEPS=[{n:1,l:"Basic Details"},{n:2,l:"Upload Order"},{n:3,l:"Facts & Grounds"},{n:4,l:"AI Draft"},{n:5,l:"Download"}];

  return(<div>
    <button onClick={onBack} style={{...S.btnO,marginBottom:14,fontSize:12}}>← All Appeals</button>
    {/* Step bar */}
    <div style={{display:"flex",alignItems:"center",marginBottom:20,overflowX:"auto",gap:0}}>
      {STEPS.map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flexShrink:0}}>
        <div onClick={()=>appealId&&s.n>1&&setStep(s.n)} style={{display:"flex",alignItems:"center",gap:6,cursor:appealId||s.n===1?"pointer":"not-allowed"}}>
          <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:step===s.n?C.green:step>s.n?"#238636":"#e2e8f0",color:step>=s.n?"#fff":C.muted,border:`2px solid ${step>=s.n?C.green:C.border}`,flexShrink:0}}>{step>s.n?"✓":s.n}</div>
          <span style={{fontSize:10,color:step===s.n?C.green:step>s.n?"#166534":C.muted,whiteSpace:"nowrap",fontWeight:step===s.n?700:400}}>{s.l}</span>
        </div>
        {i<STEPS.length-1&&<div style={{width:20,height:2,background:step>s.n?C.green:C.border,margin:"0 4px",flexShrink:0}}/>}
      </div>))}
    </div>

    {step===1&&(<div style={S.card}>
      <div style={{fontWeight:700,color:C.navy,marginBottom:14}}>Step 1 — Case & Order Details</div>
      <div style={S.fg}><label style={S.label}>Select Case *</label>
        <select style={S.select} value={f.case_id} onChange={e=>set("case_id",e.target.value)}>
          <option value="">— Select Case —</option>
          {cases.map(c=><option key={c.id} value={c.id}>{c.case_number} — {c.client_name}</option>)}
        </select>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Appeal Forum</label><select style={S.select} value={f.appeal_to} onChange={e=>set("appeal_to",e.target.value)}>{APPEAL_FORUMS.map(v=><option key={v}>{v}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Order Type</label><select style={S.select} value={f.order_type} onChange={e=>set("order_type",e.target.value)}>{ORDER_TYPES.map(v=><option key={v}>{v}</option>)}</select></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Order Reference No.</label><input style={S.input} value={f.order_ref_no} onChange={e=>set("order_ref_no",e.target.value)} placeholder="e.g. ZA0701240023456"/></div>
        <div style={S.fg}><label style={S.label}>Order Date</label><input type="date" style={S.input} value={f.order_date} onChange={e=>set("order_date",e.target.value)}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Section(s) Invoked</label><input style={S.input} value={f.section_invoked} onChange={e=>set("section_invoked",e.target.value)} placeholder="e.g. Section 73, Section 16(4)"/></div>
        <div style={S.fg}><label style={S.label}>Tax Period</label><input style={S.input} value={f.tax_period} onChange={e=>set("tax_period",e.target.value)} placeholder="e.g. FY 2021-22"/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Demand Amount (₹)</label><input type="number" style={S.input} value={f.demand_amount} onChange={e=>set("demand_amount",e.target.value)}/></div>
        <div style={S.fg}><label style={S.label}>Issuing Officer</label><input style={S.input} value={f.issuing_officer} onChange={e=>set("issuing_officer",e.target.value)}/></div>
        <div style={S.fg}><label style={S.label}>Jurisdiction</label><input style={S.input} value={f.jurisdiction} onChange={e=>set("jurisdiction",e.target.value)} placeholder="e.g. CGST Division, Agra"/></div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={saveStep1} disabled={saving} style={S.btn}>{saving?"Saving…":"Save & Continue →"}</button></div>
    </div>)}

    {step===2&&(<div style={S.card}>
      <div style={{fontWeight:700,color:C.navy,marginBottom:10}}>Step 2 — Upload Impugned Order (PDF / Image)</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>AI will extract all text and auto-fill order details and grounds. Upload is optional — you can skip and fill Step 3 manually.</div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
        <label style={{...S.btnO,cursor:"pointer"}}>{orderFile?`✅ ${orderFile.name}`:"📁 Choose PDF or Image"}<input type="file" accept=".pdf,image/*" onChange={e=>setOrderFile(e.target.files[0])} style={{display:"none"}}/></label>
        <button onClick={scanOrder} disabled={!orderFile||scanning||!appealId} style={{...S.btn,opacity:!orderFile?0.5:1}}>{scanning?"🔍 Reading…":"🔍 Scan with AI"}</button>
      </div>
      {scanResult&&(<div style={{...S.card,background:"#f0fdf4",border:"1px solid #86efac"}}>
        <div style={{fontWeight:600,color:"#166534",marginBottom:8}}>✅ Extracted from Order:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[["Section",scanResult.section_invoked],["Tax Period",scanResult.tax_period],["Demand",scanResult.demand_amount?fR(scanResult.demand_amount):"—"],["Officer",scanResult.issuing_officer],["GSTIN",scanResult.gstin],["Order Type",scanResult.order_type]].map(([l,v])=>v&&v!=="—"&&v!==0?<div key={l} style={{fontSize:11}}><span style={{color:C.muted}}>{l}: </span><b>{v}</b></div>:null)}
        </div>
        {scanResult.grounds_of_demand?.length>0&&<div style={{marginTop:8}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Grounds detected ({scanResult.grounds_of_demand.length}):</div><ul style={{margin:0,paddingLeft:18}}>{scanResult.grounds_of_demand.map((g,i)=><li key={i} style={{fontSize:11,color:C.sub,marginBottom:2}}>{g}</li>)}</ul></div>}
      </div>)}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
        <button onClick={()=>setStep(1)} style={S.btnO}>← Back</button>
        <button onClick={()=>setStep(3)} style={S.btn}>Continue → Step 3</button>
      </div>
    </div>)}

    {step===3&&(<div style={S.card}>
      <div style={{fontWeight:700,color:C.navy,marginBottom:14}}>Step 3 — Facts & Grounds of Appeal</div>
      <div style={S.fg}><label style={S.label}>Statement of Facts *</label>
        <textarea style={{...S.input,minHeight:100,lineHeight:1.6}} value={facts} onChange={e=>setFacts(e.target.value)} placeholder="Describe the background: business nature, what the officer alleged, what documents you had, timeline of events…"/></div>
      <div style={{fontWeight:600,color:C.text,margin:"14px 0 8px",fontSize:13}}>Grounds of Appeal <span style={{fontSize:11,color:C.muted,fontWeight:400}}>(AI will add legal citations from your library to each ground)</span></div>
      {grounds.map((g,i)=>(<div key={i} style={{...S.card,background:"#f8fafc",borderLeft:`2px solid ${C.green}`,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontWeight:700,fontSize:12,color:C.green}}>Ground No. {g.ground_no}</span>
          {grounds.length>1&&<button onClick={()=>setGrounds(p=>p.filter((_,j)=>j!==i).map((g,j)=>({...g,ground_no:j+1})))} style={{background:"none",border:"none",color:"#c53030",cursor:"pointer",fontSize:12}}>Remove</button>}
        </div>
        <div style={S.fg}><label style={S.label}>Heading</label><input style={S.input} value={g.heading} onChange={e=>{const n=[...grounds];n[i]={...n[i],heading:e.target.value};setGrounds(n);}} placeholder="e.g. Denial of ITC without opportunity of hearing — violates principles of natural justice"/></div>
        <div style={S.fg}><label style={S.label}>Your Argument</label><textarea style={{...S.input,minHeight:70}} value={g.text} onChange={e=>{const n=[...grounds];n[i]={...n[i],text:e.target.value};setGrounds(n);}} placeholder="Explain your legal/factual argument. AI will add specific citations from the Legal Library…"/></div>
      </div>))}
      <button onClick={()=>setGrounds(p=>[...p,{ground_no:p.length+1,heading:"",text:""}])} style={{...S.btnO,fontSize:11,marginBottom:14}}>+ Add Ground</button>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Delay in filing (days) — enter 0 if within time</label><input type="number" style={S.input} value={delay} onChange={e=>setDelay(e.target.value)} min="0"/></div>
        {parseInt(delay)>0&&<div style={S.fg}><label style={S.label}>Sufficient cause for delay</label><textarea style={{...S.input,minHeight:50}} value={condonation} onChange={e=>setCondonation(e.target.value)}/></div>}
      </div>
      <div style={S.fg}><label style={S.label}>Prayer (relief sought)</label><textarea style={{...S.input,minHeight:60}} value={prayer} onChange={e=>setPrayer(e.target.value)}/></div>
      <div style={{fontWeight:600,color:C.text,margin:"10px 0 8px",fontSize:13}}>Annexures / Documents</div>
      {annexures.map((a,i)=>(<div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
        <input style={{...S.input,width:110,fontSize:12}} value={a.label} onChange={e=>{const n=[...annexures];n[i]={...n[i],label:e.target.value};setAnnexures(n);}} placeholder="Annexure A"/>
        <input style={{...S.input,flex:1,fontSize:12}} value={a.description} onChange={e=>{const n=[...annexures];n[i]={...n[i],description:e.target.value};setAnnexures(n);}} placeholder="Description"/>
        <button onClick={()=>setAnnexures(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#c53030",cursor:"pointer",fontSize:16,flexShrink:0}}>✕</button>
      </div>))}
      <button onClick={()=>setAnnexures(p=>[...p,{label:`Annexure ${String.fromCharCode(65+p.length)}`,description:""}])} style={{...S.btnO,fontSize:11,marginBottom:14}}>+ Add Annexure</button>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setStep(2)} style={S.btnO}>← Back</button>
        <button onClick={saveStep3} disabled={saving} style={S.btn}>{saving?"Saving…":"Save & Generate →"}</button>
      </div>
    </div>)}

    {step===4&&(<div style={S.card}>
      <div style={{fontWeight:700,color:C.navy,marginBottom:8}}>Step 4 — AI Appeal Draft</div>
      {!draft&&<button onClick={generateDraft} disabled={generating||!appealId} style={{...S.btn,marginBottom:14}}>{generating?"✨ Drafting…":"✨ Generate Appeal Draft"}</button>}
      {generating&&<div style={{textAlign:"center",padding:30}}>
        <div style={{fontSize:36,marginBottom:10}}>⚖️</div>
        <div style={{fontWeight:700,color:C.navy,marginBottom:6}}>AI drafting your appeal…</div>
        <div style={{fontSize:11,color:C.muted}}>Searching Legal Library → Matching sections & case law → Drafting grounds with citations</div>
      </div>}
      {draft&&(<>
        {refsUsed.length>0?(<div style={{...S.card,background:"#f0fdf4",border:"1px solid #86efac",marginBottom:10}}>
          <div style={{fontWeight:600,color:"#166534",marginBottom:6}}>✅ {refsUsed.length} Legal Library references cited in this draft:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {refsUsed.map((r,i)=><span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#fff",color:C.navy,border:`1px solid ${C.border}`}}>[REF-{r.ref_no||i+1}] {(r.title||"").substring(0,30)}{(r.title||"").length>30?"…":""}</span>)}
          </div>
        </div>):<div style={{...S.card,background:"#fffbeb",border:"1px solid #fcd34d",marginBottom:10,padding:10}}>
          <span style={{fontSize:12,color:"#92400e"}}>⚠ Legal Library is empty — draft has no citations. Upload GST Act sections, Rules, Circulars and Court orders to the Legal Library.</span>
        </div>}
        <textarea style={{...S.input,minHeight:500,fontFamily:"'Times New Roman',serif",fontSize:12,lineHeight:1.8,whiteSpace:"pre-wrap"}} value={draft} onChange={e=>setDraft(e.target.value)}/>
        <div style={{...S.card,background:"#fff1f0",border:"1px solid #feb2b2",marginTop:8,padding:10}}>
          <span style={{fontSize:11,color:"#c53030"}}>⚠ AI-assisted draft for review only. All citations must be verified. Review with a qualified advocate/CA before filing.</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
          <button onClick={generateDraft} disabled={generating} style={S.btnO}>🔄 Regenerate</button>
          <button onClick={saveDraft} style={S.btnO}>💾 Save Edits</button>
          <button onClick={()=>setStep(5)} style={S.btn}>Download → Step 5</button>
        </div>
      </>)}
      {!draft&&<button onClick={()=>setStep(3)} style={{...S.btnO,marginTop:8}}>← Back to Grounds</button>}
    </div>)}

    {step===5&&(<div style={{...S.card,textAlign:"center",padding:40}}>
      <div style={{fontSize:48,marginBottom:12}}>📄</div>
      <div style={{fontWeight:700,fontSize:16,color:"#166534",marginBottom:6}}>Appeal Draft Ready</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:20}}>
        {refsUsed.length>0?`${refsUsed.length} Legal Library references cited — all traceable to uploaded documents`:"No references cited (Legal Library is empty)"}
      </div>
      <button onClick={downloadWord} style={{...S.btn,fontSize:14,padding:"14px 28px"}}>📝 Download as Word (.doc)</button>
      <div style={{marginTop:16,fontSize:11,color:"#92400e"}}>⚠ Review carefully before filing with GSTAT or Appellate Authority</div>
      <button onClick={()=>setStep(4)} style={{...S.btnO,marginTop:14,fontSize:12}}>← Back to Draft</button>
    </div>)}
  </div>);
}




// ══════════════════════════════════════════════════════════════════════════════
// AI RESEARCH
// ══════════════════════════════════════════════════════════════════════════════
function AIResearch({token,toast}){
  const C=getC();const S=getS();
  const[query,setQuery]=useState("");const[mode,setMode]=useState("keyword");
  const[results,setResults]=useState([]);const[memo,setMemo]=useState("");
  const[step,setStep]=useState("search"); // search | results | memo
  const[loading,setLoading]=useState(false);const[memoLoading,setMemoLoading]=useState(false);
  const[history,setHistory]=useState([]);const[viewing,setViewing]=useState(null);

  useEffect(()=>{api("/research/history","GET",null,token).then(d=>setHistory(d.history||[])).catch(()=>{});},[token]);

  const search=async()=>{
    if(!query.trim())return toast("Enter a search query","error");
    setLoading(true);setStep("results");setResults([]);setMemo("");
    try{const d=await api("/research/search","POST",{query,mode},token);
      setResults(d.results||[]);
      if(d.count===0)toast("No matching references found in library. Try different keywords or upload more references.","error");
    }catch(e){toast(e.message,"error");}setLoading(false);
  };

  const generateMemo=async()=>{
    if(!query.trim())return;
    setMemoLoading(true);
    try{const d=await api("/research/memo","POST",{query},token);
      setMemo(d.memo||"");setStep("memo");
      toast(d.grounded?`✅ Research memo ready — ${d.references_used?.length||0} references cited`:"⚠ Memo ready — no library references found","success");
    }catch(e){toast(e.message,"error");}setMemoLoading(false);
  };

  const isCase=t=>["hc_order","sc_order","gstat_order","aar"].includes(t);

  return(<div>
    <div style={{...S.card,background:"#eff6ff",border:"1px solid #bfdbfe",marginBottom:14}}>
      <div style={{fontWeight:700,color:"#1d4ed8",marginBottom:3}}>🔍 AI Legal Research</div>
      <div style={{fontSize:12,color:"#1d4ed8"}}>Search your Legal Library by section, rule, circular, keyword or case issue. Results come only from your uploaded references.</div>
    </div>
    <div style={{...S.card,marginBottom:14}}>
      <div style={S.fg}><label style={S.label}>Search Query</label>
        <textarea style={{...S.input,minHeight:70}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Examples:&#10;• Section 16(4) ITC reversal&#10;• High Court judgments on time-barred SCN&#10;• Circular on e-way bill exemption&#10;• GSTAT order on Input Tax Credit mismatch"/>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        {[["keyword","🔍 Keyword"],["section","📖 Section"],["case","⚖️ Case Law"],["circular","📋 Circular"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMode(k)} style={{...mode===k?S.btn:S.btnO,padding:"6px 14px",fontSize:11}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={search} disabled={loading||!query.trim()} style={{...S.btn,opacity:!query.trim()?0.5:1}}>{loading?"🔍 Searching…":"🔍 Search Library"}</button>
        <button onClick={generateMemo} disabled={memoLoading||!query.trim()} style={{...S.btnO,opacity:!query.trim()?0.5:1}}>{memoLoading?"✨ Generating…":"✨ Generate Research Memo"}</button>
        {(results.length>0||memo)&&<button onClick={()=>{setStep("search");setResults([]);setMemo("");}} style={{...S.btnO,fontSize:11}}>Clear</button>}
      </div>
    </div>

    {/* Quick example queries */}
    {step==="search"&&!loading&&(<div style={S.card}>
      <div style={{fontWeight:600,fontSize:12,color:C.text,marginBottom:8}}>💡 Example Research Queries:</div>
      {["Section 16(4) ITC reversal — time limit judgments",
        "Show Cause Notice issued after limitation period — High Court orders",
        "CBIC Circular on ITC mismatch between GSTR-2A and books",
        "Natural justice — opportunity of hearing before demand — Supreme Court",
        "GSTAT orders on penalty under Section 74 when no suppression",
        "Rule 89 refund — zero-rated supply without payment of IGST",
      ].map(ex=><button key={ex} onClick={()=>setQuery(ex)} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:6,background:"transparent",color:C.sub,cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:5}}>🔍 {ex}</button>)}
      {history.length>0&&(<><div style={{fontWeight:600,fontSize:12,color:C.text,margin:"14px 0 8px"}}>🕐 Recent Searches:</div>
        {history.slice(0,5).map(h=><div key={h.id} onClick={()=>setQuery(h.query)} style={{fontSize:11,color:C.muted,padding:"4px 0",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
          {h.query.substring(0,60)}{h.query.length>60?"…":""} <span style={{color:C.border}}>·</span> {new Date(h.created_at).toLocaleDateString("en-IN")}</div>)}</>)}
    </div>)}

    {/* Search Results */}
    {step==="results"&&(<div>
      {loading?<Spinner/>:(
        results.length===0?<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>
          No matching references found. Try different keywords or upload more references to the Legal Library.
        </div>:(
          <div style={S.card}>
            <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:10}}>{results.length} references found for: "{query}"</div>
            {results.map((r,i)=>(
              <div key={r.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:10,fontWeight:700,color:C.muted,marginRight:8}}>[REF-{i+1}]</span>
                    <b style={{fontSize:13,color:C.navy}}>{r.title}</b>
                    <div style={{marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {badge(REF_TYPES?.find?.(t=>t[0]===r.ref_type)?.[1]||r.ref_type,REF_COLORS?.[r.ref_type]||"blue")}
                      {isCase(r.ref_type)&&r.court_name&&badge(r.court_name,"teal")}
                      {r.jurisdiction&&badge(r.jurisdiction,"gray")}
                      {badge(`Score: ${r.score}`,r.score>3?"green":r.score>1?"amber":"gray")}
                    </div>
                    {isCase(r.ref_type)?<div style={{fontSize:11,color:C.sub,marginTop:4}}>{r.case_citation||"—"} · {fD(r.case_date)}</div>
                    :<div style={{fontSize:11,color:C.sub,marginTop:4}}>{r.act_name||""} {r.reference_no||""}</div>}
                  </div>
                  <button onClick={()=>setViewing(viewing?.id===r.id?null:r)} style={{...S.btnO,fontSize:10,padding:"3px 10px",marginLeft:8,flexShrink:0}}>
                    {viewing?.id===r.id?"Hide":"View"}
                  </button>
                </div>
                {viewing?.id===r.id&&(<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:6,padding:14,maxHeight:300,overflowY:"auto",fontSize:12,lineHeight:1.8,color:"#1a1a1a",fontFamily:"Georgia,serif",whiteSpace:"pre-wrap",marginTop:6}}>
                  {r.full_text?.substring(0,3000)}{(r.full_text||"").length>3000?"\n\n[…text truncated — open full reference to see complete text]":""}
                </div>)}
              </div>
            ))}
          </div>
        )
      )}
    </div>)}

    {/* Research Memo */}
    {step==="memo"&&memo&&(<div style={S.card}>
      <div style={{fontWeight:700,color:C.navy,marginBottom:8}}>📄 Research Memo: {query}</div>
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:6,padding:16,fontSize:12,lineHeight:1.9,color:"#1a1a1a",fontFamily:"Georgia,serif",whiteSpace:"pre-wrap",maxHeight:600,overflowY:"auto"}}>
        {memo}
      </div>
      <div style={{marginTop:10,display:"flex",gap:8}}>
        <button onClick={()=>navigator.clipboard.writeText(memo).then(()=>toast("✅ Copied","success"))} style={{...S.btnO,fontSize:11}}>📋 Copy</button>
        <button onClick={()=>setStep("results")} style={{...S.btnO,fontSize:11}}>← View References</button>
      </div>
    </div>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// AI CHAT
// ══════════════════════════════════════════════════════════════════════════════
function AIChat({token,toast}){
  const C=getC();const S=getS();
  const[messages,setMessages]=useState([{role:"assistant",content:"Namaste! 🙏 I am GSTAT AI Chat Assistant.\n\nMain sirf aapki Legal Library ke references se jawab dunga. Koi bhi citation aapke uploaded documents se hi hogi — internet ya memory se nahi.\n\nExamples:\n• Section 16(4) ITC reversal par kya case law hai?\n• SCN time-barred hone par kya defense hai?\n• GSTAT mein appeal file karne ki kya procedure hai?"}]);
  const[input,setInput]=useState("");const[loading,setLoading]=useState(false);
  const bottomRef=useRef();
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input.trim()};
    setMessages(p=>[...p,userMsg]);setInput("");setLoading(true);
    try{
      const d=await api("/chat","POST",{messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))},token);
      setMessages(p=>[...p,{role:"assistant",content:d.reply,refs:d.references_used||[]}]);
    }catch(e){setMessages(p=>[...p,{role:"assistant",content:"Sorry, an error occurred: "+e.message}]);}
    setLoading(false);
  };

  const EXAMPLES=["Section 16 ITC reversal par Delhi High Court ka sabse strong judgment dikhao","SCN issue hone ke baad time limit kya hoti hai appeal ke liye?","Section 73 aur 74 mein kya difference hai — penalty ke context mein","GSTAT mein stay of demand kaise milti hai?","Input tax credit mismatch ke case mein kya defense banana chahiye?"];

  return(<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 140px)"}}>
    <div style={{...S.card,background:"#f0fdf4",border:"1px solid #86efac",marginBottom:10,flexShrink:0}}>
      <div style={{fontWeight:700,color:"#166534",fontSize:13}}>💬 GSTAT AI Chat</div>
      <div style={{fontSize:11,color:"#166534"}}>Jawab sirf aapki Legal Library se — internet ya AI memory se nahi. Har citation traceable hai.</div>
    </div>
    <div style={{flex:1,overflowY:"auto",marginBottom:10}}>
      {messages.map((m,i)=>(
        <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
          {m.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:C.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:2}}>G</div>}
          <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
            background:m.role==="user"?C.navy:"#fff",color:m.role==="user"?"#fff":C.text,
            fontSize:13,lineHeight:1.7,border:m.role==="user"?"none":`1px solid ${C.border}`,
            boxShadow:m.role==="assistant"?"0 1px 4px rgba(0,0,0,0.06)":"none",
            whiteSpace:"pre-wrap",fontFamily:m.role==="assistant"?"Georgia,serif":"inherit"}}>
            {m.content}
            {m.refs?.length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.2)"}}>
              <div style={{fontSize:10,color:m.role==="user"?"rgba(255,255,255,0.6)":C.muted,marginBottom:4}}>References from library:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {m.refs.map((r,j)=><span key={j} style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:m.role==="user"?"rgba(255,255,255,0.2)":"#f0fdf4",color:m.role==="user"?"#fff":"#166534",border:"none"}}>[{r.ref_no}] {(r.title||"").substring(0,25)}</span>)}
              </div>
            </div>}
          </div>
          {m.role==="user"&&<div style={{width:32,height:32,borderRadius:"50%",background:C.navy,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginLeft:8,marginTop:2}}>U</div>}
        </div>
      ))}
      {loading&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:C.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>G</div>
        <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:`bounce 0.6s ${i*0.2}s infinite`}}/>)}</div>
      </div>}
      <div ref={bottomRef}/>
      <style>{"@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}"}</style>
    </div>
    {messages.length===1&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
      {EXAMPLES.map(ex=><button key={ex} onClick={()=>setInput(ex)} style={{fontSize:11,padding:"6px 12px",borderRadius:16,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,cursor:"pointer",fontFamily:"inherit"}}>{ex.substring(0,50)}…</button>)}
    </div>}
    <div style={{display:"flex",gap:8,flexShrink:0}}>
      <textarea value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        placeholder="GST question poochho… (Enter to send, Shift+Enter for new line)"
        style={{...S.input,flex:1,minHeight:48,maxHeight:120,resize:"none",lineHeight:1.5}}/>
      <button onClick={send} disabled={loading||!input.trim()} style={{...S.btn,padding:"0 18px",alignSelf:"flex-end",height:48,opacity:!input.trim()?0.5:1}}>
        {loading?"…":"Send"}
      </button>
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// USER SETTINGS + ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════
function UserSettings({token,user,toast,onLogout,isAdmin,theme,onThemeChange}){
  const C=getC();const S=getS();
  const[activeTab,setActiveTab]=useState("profile");
  const[f,setF]=useState({name:user?.name||"",firm_name:user?.firm_name||"",phone:user?.phone||""});
  const[cp,setCp]=useState({current:"",new_pass:"",confirm:""});
  const[saving,setSaving]=useState(false);
  const[adminKey,setAdminKey]=useState("");
  const[lang,setLang]=useState("english");
  useEffect(()=>{api("/auth/profile","GET",null,token).then(d=>setLang(d.user?.language||"english")).catch(()=>{});},[token]);
  const saveProfile=async()=>{setSaving(true);try{await api("/auth/profile","PUT",f,token);toast("✅ Profile updated","success");}catch(e){toast(e.message,"error");}setSaving(false);};
  const changePass=async()=>{if(!cp.current||!cp.new_pass)return toast("Fill all fields","error");if(cp.new_pass!==cp.confirm)return toast("Passwords don't match","error");if(cp.new_pass.length<8)return toast("Min 8 characters","error");setSaving(true);try{await api("/auth/change-password","POST",{current_password:cp.current,new_password:cp.new_pass},token);toast("✅ Password changed. Login again.","success");setTimeout(onLogout,2000);}catch(e){toast(e.message,"error");}setSaving(false);};
  const saveLang=async(l)=>{try{await api("/auth/language","PUT",{language:l},token);setLang(l);toast(`✅ Language: ${l}`,"success");}catch(e){toast(e.message,"error");};};
  const claimAdmin=async()=>{if(!adminKey)return toast("Enter key","error");try{await api("/admin/claim","POST",{setup_key:adminKey},token);toast("✅ Admin granted! Refresh.","success");setTimeout(()=>window.location.reload(),2000);}catch(e){toast(e.message,"error");};};
  const TABS=[["👤","profile","Profile"],["🔐","password","Password"],["🌐","language","Language"],["🎨","display","Display"],["ℹ️","account","Account"]];
  return(<div style={{maxWidth:700,margin:"0 auto"}}>
    <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:16}}>⚙️ Settings</div>
    <div style={{display:"flex",gap:0,background:C.bg,borderRadius:8,padding:4,marginBottom:20,border:`1px solid ${C.border}`}}>
      {TABS.map(([icon,key,label])=>(<button key={key} onClick={()=>setActiveTab(key)} style={{flex:1,padding:"9px 4px",border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:activeTab===key?700:400,background:activeTab===key?C.card:C.bg,color:activeTab===key?"#0B6623":C.muted,boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,0.1)":"none",whiteSpace:"nowrap"}}>{icon} {label}</button>))}
    </div>
    {activeTab==="profile"&&(<div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:14}}>👤 Profile</div><div style={S.col2}><div style={S.fg}><label style={S.label}>Full Name</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div><div style={S.fg}><label style={S.label}>Firm Name</label><input style={S.input} value={f.firm_name} onChange={e=>setF(p=>({...p,firm_name:e.target.value}))}/></div></div><div style={S.col2}><div style={S.fg}><label style={S.label}>Email (cannot change)</label><input style={{...S.input,opacity:0.6}} value={user?.email||""} disabled/></div><div style={S.fg}><label style={S.label}>Mobile</label><input style={S.input} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))}/></div></div><div style={{display:"flex",gap:8}}><button onClick={saveProfile} disabled={saving} style={S.btn}>{saving?"Saving…":"Save Profile"}</button><button onClick={onLogout} style={{...S.btnR,marginLeft:"auto"}}>Logout</button></div></div>)}
    {activeTab==="password"&&(<div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:14}}>🔐 Change Password</div><div style={S.fg}><label style={S.label}>Current Password</label><input type="password" style={S.input} value={cp.current} onChange={e=>setCp(p=>({...p,current:e.target.value}))}/></div><div style={S.col2}><div style={S.fg}><label style={S.label}>New Password</label><input type="password" style={S.input} value={cp.new_pass} onChange={e=>setCp(p=>({...p,new_pass:e.target.value}))}/></div><div style={S.fg}><label style={S.label}>Confirm</label><input type="password" style={S.input} value={cp.confirm} onChange={e=>setCp(p=>({...p,confirm:e.target.value}))}/></div></div><button onClick={changePass} disabled={saving} style={S.btn}>Change Password</button></div>)}
    {activeTab==="language"&&(<div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>🌐 AI Language</div><div style={{fontSize:12,color:C.muted,marginBottom:14}}>Language for AI appeal drafts, research memos and chat. Citations remain in English.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[["english","🇬🇧","English","Formal English"],["hindi","🇮🇳","Hindi","Hindi in Devanagari"],["hinglish","🔀","Hinglish","Hindi + English mix"]].map(([val,flag,name,desc])=>(<div key={val} onClick={()=>saveLang(val)} style={{padding:14,borderRadius:8,cursor:"pointer",textAlign:"center",border:`2px solid ${lang===val?"#0B6623":C.border}`,background:lang===val?"#f0fdf4":C.card}}><div style={{fontSize:28,marginBottom:4}}>{flag}</div><div style={{fontWeight:700,fontSize:12,color:lang===val?"#0B6623":C.text}}>{name}</div><div style={{fontSize:10,color:C.muted}}>{desc}</div>{lang===val&&<div style={{fontSize:10,color:"#0B6623",marginTop:4,fontWeight:700}}>✅ Active</div>}</div>))}</div></div>)}
    {activeTab==="display"&&(<div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>🎨 Display Theme</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[["light","☀️","Light","#f5f6fa","#1a2b4e"],["dark","🌙","Dark","#0d1117","#e6edf3"],["green","🌿","Green","#f0fdf4","#14532d"]].map(([val,icon,name,bg,tx])=>(<div key={val} onClick={()=>onThemeChange(val)} style={{padding:14,borderRadius:8,cursor:"pointer",border:`2px solid ${theme===val?"#0B6623":C.border}`,background:theme===val?"#f0fdf4":C.card}}><div style={{width:"100%",height:40,borderRadius:6,background:bg,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontWeight:700,color:tx}}>Preview</span></div><div style={{fontWeight:700,fontSize:12,color:theme===val?"#0B6623":C.text,textAlign:"center"}}>{icon} {name}</div>{theme===val&&<div style={{fontSize:10,color:"#0B6623",textAlign:"center",marginTop:4,fontWeight:700}}>✅ Active</div>}</div>))}</div></div>)}
    {activeTab==="account"&&(<div><div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:10}}>ℹ️ Account Info</div>{[["Email",user?.email],["Role",user?.role?.toUpperCase()],["Plan",(user?.plan||"starter").toUpperCase()],["Admin",isAdmin?"Yes ✅":"No"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:C.text}}>{v}</span></div>))}</div>{!isAdmin&&(<div style={S.card}><div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:8}}>👑 Claim Admin</div><div style={{display:"flex",gap:8}}><input type="password" style={{...S.input,flex:1}} value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="ADMIN_SETUP_KEY"/><button onClick={claimAdmin} style={S.btn}>Claim</button></div></div>)}<div style={S.card}><button onClick={onLogout} style={{...S.btnR,width:"100%",padding:12}}>🚪 Logout</button></div></div>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════
function AdminPanel({token,toast}){
  const C=getC();const S=getS();
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{api("/admin/stats","GET",null,token).then(d=>{setStats(d);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  const suspend=async(id,val)=>{
    try{await api(`/admin/users/${id}/suspend`,"POST",{suspended:val},token);
      toast(`✅ User ${val?"suspended":"unsuspended"}`,"success");
      api("/admin/stats","GET",null,token).then(d=>setStats(d)).catch(()=>{});
    }catch(e){toast(e.message,"error");}
  };
  if(loading)return<Spinner/>;
  const s=stats?.stats||{};
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:16}}>
      {[["👥","Users",s.total_users],["👥","Clients",s.total_clients],["📋","Cases",s.total_cases],["⚖️","Appeals",s.total_appeals],["📚","Library Refs",s.total_legal_refs]].map(([icon,label,val])=>(
        <div key={label} style={{...S.kpi,borderTop:`3px solid ${C.green}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
          <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{val||0}</div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{label}</div>
        </div>
      ))}
    </div>
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:C.text}}>Recent Users</div>
      <div style={{overflowX:"auto"}}>
        <table style={S.tbl}><thead><tr>{["Name","Email","Role","Plan","Last Active","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(stats?.recent_users||[]).map(u=>(
          <tr key={u.id}>
            <td style={{...S.td,fontWeight:600}}>{u.name}</td>
            <td style={{...S.td,fontSize:11}}>{u.email}</td>
            <td style={S.td}>{badge(u.role?.toUpperCase()||"CA","blue")}</td>
            <td style={S.td}>{badge((u.plan||"starter").toUpperCase(),"gray")}</td>
            <td style={{...S.td,fontSize:11}}>{u.last_active_at?new Date(u.last_active_at).toLocaleDateString("en-IN"):"Never"}</td>
            <td style={S.td}>{badge(u.is_suspended?"Suspended":"Active",u.is_suspended?"red":"green")}</td>
            <td style={S.tdR}>
              <button onClick={()=>suspend(u.id,!u.is_suspended)}
                style={{...u.is_suspended?S.btn:S.btnR,fontSize:10,padding:"3px 8px"}}>
                {u.is_suspended?"Unsuspend":"Suspend"}
              </button>
            </td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  </div>);
}
