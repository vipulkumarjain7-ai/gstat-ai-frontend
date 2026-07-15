import{useState,useEffect,useCallback,useRef,useMemo}from"react";

const API=process.env.REACT_APP_API||"https://gstat-ai-backend.onrender.com/api";
const api=async(path,method="GET",body=null,token=null)=>{
  const headers={"Content-Type":"application/json"};
  if(token)headers["Authorization"]=`Bearer ${token}`;
  const res=await fetch(`${API}${path}`,{method,headers,body:body?JSON.stringify(body):undefined});
  const d=await res.json();
  if(!d.success)throw new Error(d.message||"Request failed");
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
  const Inp=({label,type="text",placeholder,value,onChange,onEnter,maxLength,autoFocus,hint})=>(
    <div style={{marginBottom:12}}>
      {label&&<div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>{label}</div>}
      <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
        onChange={e=>onChange(e.target.value)} maxLength={maxLength}
        onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()}
        style={inp}/>
      {hint&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{hint}</div>}
    </div>
  );
  const Btn=({onClick,children,variant="green"})=>(
    <button onClick={onClick} disabled={loading||warming}
      style={{width:"100%",padding:13,background:variant==="green"?C.green:variant==="navy"?C.navy:"transparent",
        color:variant==="outline"?C.navy:"#fff",border:variant==="outline"?`1.5px solid ${C.border}`:"none",
        borderRadius:7,fontSize:13,fontWeight:700,cursor:loading||warming?"not-allowed":"pointer",
        opacity:loading||warming?0.7:1,fontFamily:"inherit"}}>
      {loading?"Please wait…":warming?"Connecting…":children}
    </button>
  );
  const ErrBox=()=>err?<div style={{background:"#fff1f0",border:"1px solid #feb2b2",color:"#c53030",padding:"10px 14px",borderRadius:7,fontSize:13,marginBottom:14,lineHeight:1.5}}>⚠ {err}</div>:null;
  const SuccBox=()=>success?<div style={{background:"#f0fdf4",border:"1px solid #86efac",color:"#166534",padding:"10px 14px",borderRadius:7,fontSize:13,marginBottom:14}}>✅ {success}</div>:null;

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
        <div style={{display:"flex",gap:4}}>
          {[["☀️","light"],["🌙","dark"],["🌿","green"]].map(([icon,t])=>(
            <button key={t} onClick={()=>changeTheme(t)} title={t+" theme"}
              style={{background:theme===t?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)",border:"none",borderRadius:4,color:"#fff",fontSize:12,padding:"4px 6px",cursor:"pointer"}}>
              {icon}
            </button>
          ))}
        </div>
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
      const res=await fetch(`${API}/legal-refs/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast(`✅ ${d.message}`,"success");setModal(null);load();}
      else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}setSaving(false);
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
      <div style={{background:"#fff",color:"#1a1a1a",border:"1px solid #d0d7de",borderRadius:6,padding:18,maxHeight:520,overflowY:"auto",fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"Georgia,'Times New Roman',serif",marginTop:6,boxShadow:"inset 0 1px 4px rgba(0,0,0,0.04)"}}>
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
      <button onClick={()=>setModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Reference</button>
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
    {modal&&(<Modal title="Add Legal Reference" onClose={()=>setModal(null)} wide>
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
      const res=await fetch(`${API}/appeals/${appealId}/scan-order`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
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
