import{useState,useEffect,useCallback,useRef}from"react";
const API=process.env.REACT_APP_API||"https://gstat-ai-backend.onrender.com/api";
const api=async(path,method="GET",body=null,token=null)=>{
  const headers={"Content-Type":"application/json"};
  if(token)headers["Authorization"]=`Bearer ${token}`;
  const res=await fetch(`${API}${path}`,{method,headers,body:body?JSON.stringify(body):undefined});
  const d=await res.json();
  if(!d.success)throw new Error(d.message||"Request failed");
  return d;
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const C={bg:"#f5f6fa",card:"#ffffff",border:"#e2e8f0",text:"#1a2b4e",
  sub:"#4a5568",muted:"#94a3b8",green:"#0B6623",navy:"#1a2b4e"};
const S={
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:16,marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
  input:{width:"100%",padding:"10px 14px",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:6,
    fontSize:13,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
  select:{width:"100%",padding:"9px 12px",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:6,
    fontSize:13,color:C.text,fontFamily:"inherit"},
  btn:{padding:"9px 18px",background:C.green,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",
    fontSize:13,fontWeight:600,fontFamily:"inherit"},
  btnO:{padding:"9px 18px",background:"transparent",color:C.navy,border:`1.5px solid ${C.border}`,
    borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  btnR:{padding:"7px 14px",background:"#fff1f0",color:"#c53030",border:"1px solid #feb2b2",
    borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  btnNav:{padding:"8px 16px",background:"transparent",border:"none",cursor:"pointer",
    fontSize:12,fontFamily:"inherit"},
  th:{padding:"9px 12px",background:"#f8fafc",borderBottom:`1.5px solid ${C.border}`,
    textAlign:"left",fontSize:11,fontWeight:700,color:C.sub,whiteSpace:"nowrap"},
  td:{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.text,verticalAlign:"middle"},
  tdR:{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.text,textAlign:"right"},
  tbl:{width:"100%",borderCollapse:"collapse"},
  label:{display:"block",fontSize:11,fontWeight:600,color:C.sub,marginBottom:4},
  fg:{marginBottom:12},
  col2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:0},
  col3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:0},
  kpi:{background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",textAlign:"center"},
};

const today=()=>new Date().toISOString().split("T")[0];
const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
const fD=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

function Spinner(){return(<div style={{textAlign:"center",padding:40,color:C.muted}}>
  <div style={{display:"inline-block",width:32,height:32,border:`3px solid ${C.border}`,
    borderTopColor:C.green,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
  <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
</div>);}

function Toast({msg,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  const bg=type==="error"?"#fff1f0":type==="success"?"#f0fdf4":"#fffbeb";
  const color=type==="error"?"#c53030":type==="success"?"#166534":"#92400e";
  return(<div style={{position:"fixed",bottom:20,right:20,maxWidth:380,padding:"12px 16px",
    borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",background:bg,color,fontSize:13,
    zIndex:999,display:"flex",alignItems:"flex-start",gap:10}}>
    <span style={{flex:1}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
  </div>);}

function Modal({title,onClose,children,wide}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
    <div style={{background:C.card,borderRadius:10,width:"100%",maxWidth:wide?760:500,boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,fontSize:15,color:C.text}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>✕</button>
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  </div>);}

function badge(text,color="blue"){
  const map={green:["#f0fdf4","#166534","#86efac"],red:["#fff1f0","#c53030","#feb2b2"],
    amber:["#fffbeb","#92400e","#fcd34d"],blue:["#eff6ff","#1d4ed8","#bfdbfe"],
    purple:["#faf5ff","#6b21a8","#d8b4fe"],gray:["#f8fafc","#475569","#cbd5e1"],
    teal:["#f0fdfa","#0f766e","#5eead4"]};
  const[bg,fg,border]=map[color]||map.blue;
  return<span style={{background:bg,color:fg,border:`1px solid ${border}`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{text}</span>;
}

const STATUS_CONFIG={
  new:{label:"New",color:"gray"},
  documents_uploaded:{label:"Docs Uploaded",color:"blue"},
  research_done:{label:"Researched",color:"purple"},
  draft_generated:{label:"Draft Ready",color:"teal"},
  under_review:{label:"Under Review",color:"amber"},
  filed:{label:"Filed",color:"green"},
  decided:{label:"Decided",color:"green"},
  closed:{label:"Closed",color:"gray"},
};
const PRIORITY_CONFIG={high:{label:"High",color:"red"},medium:{label:"Medium",color:"amber"},low:{label:"Low",color:"blue"}};
const DEADLINE_CONFIG={overdue:{label:"OVERDUE",color:"red"},critical:{label:"< 7 Days",color:"red"},warning:{label:"< 30 Days",color:"amber"},ok:{label:"OK",color:"green"}};

// ── Auth Screen helpers (module-level to prevent re-mount) ────────────────────
const GInput=({type="text",label,placeholder,value,onChange,onEnter,maxLength,autoFocus,disabled,hint})=>(
  <div style={S.fg}>
    {label&&<label style={S.label}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus} disabled={disabled}
      onChange={e=>onChange(e.target.value)} maxLength={maxLength}
      onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()}
      style={{...S.input,background:disabled?"#f8fafc":"#fff"}}/>
    {hint&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{hint}</div>}
  </div>
);
const GBtn=({onClick,children,disabled,loading,variant="primary",style:extraStyle={}})=>(
  <button onClick={onClick} disabled={disabled||loading}
    style={{...variant==="primary"?S.btn:S.btnO,width:"100%",padding:12,opacity:disabled||loading?0.6:1,...extraStyle}}>
    {loading?"Please wait…":children}
  </button>
);

function AuthScreen({onAuth}){
  const[tab,setTab]=useState("login");
  const[loginMode,setLoginMode]=useState("password");
  const[phoneStep,setPhoneStep]=useState("input");
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[regName,setRegName]=useState("");const[regFirm,setRegFirm]=useState("");
  const[regEmail,setRegEmail]=useState("");const[regPhone,setRegPhone]=useState("");
  const[regPass,setRegPass]=useState("");const[regRole,setRegRole]=useState("ca");
  const[phone,setPhone]=useState("");const[otpCode,setOtpCode]=useState("");
  const[otpToken,setOtpToken]=useState(null);const[otpSentTo,setOtpSentTo]=useState("");
  const[loading,setLoading]=useState(false);const[warming,setWarming]=useState(true);const[err,setErr]=useState("");

  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).then(()=>setWarming(false)).catch(()=>setWarming(false));},[]);
  const finish=d=>{localStorage.setItem("gs_token",d.token);localStorage.setItem("gs_user",JSON.stringify(d.user));onAuth(d.user,d.token);};

  const doLogin=async()=>{
    if(!email||!password)return setErr("Email and password required");
    setErr("");setLoading(true);
    try{const d=await api("/auth/login","POST",{email,password},null);
      if(d.require_otp){setOtpToken(d.otp_token);setOtpSentTo(d.sent_to||"");setLoginMode("otp");}
      else finish(d);}catch(e){setErr(e.message);}
    setLoading(false);
  };
  const doVerifyOtp=async()=>{
    if(!otpCode||otpCode.length<6)return setErr("Enter 6-digit OTP");
    setErr("");setLoading(true);
    try{const d=await api("/auth/verify-otp","POST",{otp_token:otpToken,code:otpCode},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };
  const doRegister=async()=>{
    if(!regName||!regEmail||!regPass||!regFirm||!regPhone)return setErr("All fields are mandatory");
    if(regPhone.length!==10)return setErr("Enter valid 10-digit mobile number");
    setErr("");setLoading(true);
    try{const d=await api("/auth/register","POST",{name:regName,email:regEmail,password:regPass,firm_name:regFirm,phone:regPhone,role:regRole},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };
  const doSendPhoneOtp=async()=>{
    if(phone.length!==10)return setErr("Enter valid 10-digit mobile number");
    setErr("");setLoading(true);
    try{const d=await api("/auth/phone-otp-request","POST",{phone},null);setOtpToken(d.otp_token);setOtpSentTo(d.sent_to||"");setPhoneStep("otp");}
    catch(e){setErr(e.message);}setLoading(false);
  };
  const doVerifyPhoneOtp=async()=>{
    if(!otpCode||otpCode.length<6)return setErr("Enter 6-digit OTP");
    setErr("");setLoading(true);
    try{const d=await api("/auth/phone-otp-verify","POST",{otp_token:otpToken,code:otpCode},null);finish(d);}
    catch(e){setErr(e.message);}setLoading(false);
  };
  const sw=t=>{setTab(t);setErr("");setLoginMode("password");setPhoneStep("input");setOtpCode("");};

  return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
    <div style={{background:C.green,padding:"0 24px",height:62,display:"flex",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:42,height:42,background:"#fff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.green}}>G</div>
        <div>
          <div style={{color:"#fff",fontWeight:800,fontSize:17,letterSpacing:0.3}}>GSTAT AI</div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:10}}>AI-Powered GST Litigation Platform</div>
        </div>
      </div>
    </div>
    <div style={{background:C.navy,padding:"8px 24px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>🏠 Home</span>
      <span style={{color:"rgba(255,255,255,0.3)"}}>›</span>
      <span style={{color:"#fff",fontSize:11,fontWeight:600}}>Login / Register</span>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px"}}>
      <div style={{width:"100%",maxWidth:460,background:"#fff",borderRadius:10,boxShadow:"0 4px 24px rgba(0,0,0,0.1)",overflow:"hidden"}}>
        <div style={{background:C.navy,padding:"18px 24px"}}>
          <div style={{color:"#fff",fontWeight:700,fontSize:16}}>🔐 Login to GSTAT AI</div>
          <div style={{color:"rgba(255,255,255,0.65)",fontSize:11,marginTop:3}}>GST Litigation & Appeal Drafting Platform for Tax Professionals</div>
        </div>
        <div style={{padding:24}}>
          <div style={{display:"flex",background:"#f0f2f5",borderRadius:7,padding:4,marginBottom:20}}>
            {[["login","📧 Email/Password"],["phone","📱 Mobile OTP"],["register","✏️ Register"]].map(([k,l])=>(
              <button key={k} onClick={()=>sw(k)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:5,cursor:"pointer",
                fontSize:11,fontWeight:tab===k?700:400,fontFamily:"inherit",
                background:tab===k?"#fff":"transparent",color:tab===k?C.navy:C.muted,
                boxShadow:tab===k?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{l}</button>
            ))}
          </div>
          {err&&<div style={{background:"#fff1f0",border:"1px solid #feb2b2",color:"#c53030",padding:"10px 14px",borderRadius:6,fontSize:13,marginBottom:14}}>⚠ {err}</div>}
          {tab==="login"&&loginMode==="password"&&(<div>
            <GInput label="Email ID *" placeholder="yourname@email.com" value={email} onChange={setEmail} onEnter={doLogin}/>
            <GInput label="Password *" type="password" placeholder="••••••••" value={password} onChange={setPassword} onEnter={doLogin}/>
            <GBtn onClick={doLogin} loading={loading} disabled={warming}>{warming?"Connecting…":"Login →"}</GBtn>
          </div>)}
          {tab==="login"&&loginMode==="otp"&&(<div>
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#166534",marginBottom:14}}>✅ OTP sent to {otpSentTo}</div>
            <GInput label="Enter OTP *" placeholder="000000" value={otpCode} onChange={setOtpCode} onEnter={doVerifyOtp} maxLength={6} autoFocus/>
            <GBtn onClick={doVerifyOtp} loading={loading}>Verify OTP →</GBtn>
            <button onClick={()=>{setLoginMode("password");setErr("");}} style={{background:"none",border:"none",color:C.navy,fontSize:12,cursor:"pointer",marginTop:8,textDecoration:"underline"}}>← Back</button>
          </div>)}
          {tab==="phone"&&phoneStep==="input"&&(<div>
            <GInput label="Registered Mobile Number *" placeholder="10-digit mobile number"
              value={phone} onChange={v=>setPhone(v.replace(/[^0-9]/g,"").slice(0,10))} onEnter={doSendPhoneOtp}
              maxLength={10} hint="OTP will be sent to your registered email address"/>
            <GBtn onClick={doSendPhoneOtp} loading={loading} disabled={warming}>Send OTP →</GBtn>
          </div>)}
          {tab==="phone"&&phoneStep==="otp"&&(<div>
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#166534",marginBottom:14}}>✅ OTP sent to {otpSentTo}</div>
            <GInput label="Enter OTP *" placeholder="000000" value={otpCode} onChange={setOtpCode} onEnter={doVerifyPhoneOtp} maxLength={6} autoFocus/>
            <GBtn onClick={doVerifyPhoneOtp} loading={loading}>Verify & Login →</GBtn>
            <button onClick={()=>{setPhoneStep("input");setErr("");}} style={{background:"none",border:"none",color:C.navy,fontSize:12,cursor:"pointer",marginTop:8,textDecoration:"underline"}}>← Change number</button>
          </div>)}
          {tab==="register"&&(<div>
            <GInput label="Full Name *" placeholder="CA Rajesh Sharma" value={regName} onChange={setRegName}/>
            <GInput label="Firm Name *" placeholder="Sharma & Associates" value={regFirm} onChange={setRegFirm}/>
            <GInput label="Email ID *" type="email" placeholder="yourname@email.com" value={regEmail} onChange={setRegEmail}/>
            <GInput label="Mobile Number * (for OTP login)" placeholder="10-digit mobile number"
              value={regPhone} onChange={v=>setRegPhone(v.replace(/[^0-9]/g,"").slice(0,10))} maxLength={10}/>
            <div style={S.fg}><label style={S.label}>Role</label>
              <select style={S.select} value={regRole} onChange={e=>setRegRole(e.target.value)}>
                {[["ca","Chartered Accountant"],["advocate","Advocate / Lawyer"],["staff","Staff / Junior"],].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <GInput label="Password * (min 8 chars)" type="password" placeholder="••••••••" value={regPass} onChange={setRegPass} onEnter={doRegister}/>
            <GBtn onClick={doRegister} loading={loading} disabled={warming}>Create Account →</GBtn>
          </div>)}
          {warming&&<div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:10}}>⏳ Server waking up (~30s on free plan)…</div>}
        </div>
        <div style={{background:"#f8fafc",padding:"10px 24px",borderTop:`1px solid ${C.border}`,fontSize:10,color:C.muted,textAlign:"center"}}>
          GSTAT AI · Enterprise GST Litigation Platform · Data encrypted at rest
        </div>
      </div>
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP SHELL
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const[user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("gs_user"));}catch{return null;}});
  const[token,setToken]=useState(()=>localStorage.getItem("gs_token")||"");
  const[view,setView]=useState("dashboard");
  const[toast,setToast]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[mobileOpen,setMobileOpen]=useState(false);
  const[activeNav,setActiveNav]=useState(null);
  const isMobile=window.innerWidth<768;

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4500);};
  const logout=()=>{api("/auth/logout","POST",null,token).catch(()=>{});localStorage.clear();setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};
  const go=k=>{setView(k);setMobileOpen(false);setActiveNav(null);};

  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).catch(()=>{});},[]);
  useEffect(()=>{
    if(token)api("/admin/me","GET",null,token).then(d=>setIsAdmin(!!d.is_admin)).catch(()=>{});
  },[token]);
  useEffect(()=>{
    if(!token)return;
    const ping=()=>api("/auth/heartbeat","POST",null,token).catch(()=>{});
    ping();const id=setInterval(ping,5*60*1000);return()=>clearInterval(id);
  },[token]);

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const NAV_GROUPS=[
    {group:"MAIN",items:[{key:"dashboard",icon:"🏠",label:"Dashboard"}]},
    {group:"CLIENTS",items:[{key:"clients",icon:"👥",label:"Clients"}]},
    {group:"CASES",items:[
      {key:"cases",icon:"📋",label:"All Cases"},
      {key:"cases-new",icon:"➕",label:"New Case"},
    ]},
    {group:"LEGAL LIBRARY",items:[{key:"library",icon:"📚",label:"Legal Library"}]},
    {group:"APPEAL DRAFTING",items:[{key:"appeals",icon:"⚖️",label:"Appeals"}]},
    {group:"AI TOOLS",items:[
      {key:"research",icon:"🔍",label:"AI Research"},
      {key:"chat",icon:"💬",label:"AI Chat"},
    ]},
    {group:"SETTINGS",items:[{key:"settings",icon:"⚙️",label:"Settings"}]},
    ...(isAdmin?[{group:"ADMIN",items:[{key:"admin",icon:"👑",label:"Admin Panel"}]}]:[]),
  ];
  const allItems=NAV_GROUPS.flatMap(g=>g.items);
  const currentLabel=allItems.find(i=>i.key===view)?.label||"Dashboard";

  return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
    {/* ── Top Header ── */}
    <div style={{background:C.green,height:56,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,background:"#fff",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:C.green}}>G</div>
        <div>
          <div style={{color:"#fff",fontWeight:800,fontSize:15}}>GSTAT AI</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:9}}>GST Litigation Platform</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {!isMobile&&<span style={{fontSize:11,color:"rgba(255,255,255,0.85)"}}>{user.name} · {user.role?.toUpperCase()}</span>}
        <button onClick={logout} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:5,color:"#fff",fontSize:11,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        {isMobile&&<button onClick={()=>setMobileOpen(p=>!p)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:5,color:"#fff",fontSize:18,padding:"3px 10px",cursor:"pointer"}}>☰</button>}
      </div>
    </div>

    {/* ── Horizontal Nav (desktop) ── */}
    {!isMobile&&(
      <div style={{background:C.navy,borderBottom:`2px solid ${C.green}`,flexShrink:0,overflowX:"auto"}}>
        <div style={{display:"inline-flex",height:40,alignItems:"stretch"}}>
          {NAV_GROUPS.map(({group,items})=>(
            <div key={group} style={{position:"relative"}}
              onMouseEnter={()=>setActiveNav(group)} onMouseLeave={()=>setActiveNav(null)}>
              <button style={{height:40,padding:"0 14px",border:"none",
                background:activeNav===group?"rgba(255,255,255,0.08)":"transparent",
                color:items.some(i=>i.key===view)?"#fff":"rgba(255,255,255,0.75)",
                cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,
                display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
                borderBottom:items.some(i=>i.key===view)?`2px solid ${C.green}`:"2px solid transparent"}}>
                {items[0].icon} {group} {items.length>1&&"▾"}
              </button>
              {activeNav===group&&(
                <div style={{position:"absolute",top:40,left:0,background:"#fff",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.12)",borderRadius:"0 0 7px 7px",
                  minWidth:180,zIndex:100,borderTop:`2px solid ${C.green}`}}>
                  {items.map(n=>(
                    <button key={n.key} onClick={()=>go(n.key)}
                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",
                        padding:"10px 16px",border:"none",
                        background:view===n.key?"#f0fdf4":"#fff",
                        color:view===n.key?C.green:C.text,
                        cursor:"pointer",fontFamily:"inherit",fontSize:12,
                        fontWeight:view===n.key?700:400,textAlign:"left",
                        borderLeft:view===n.key?`3px solid ${C.green}`:"3px solid transparent"}}>
                      <span>{n.icon}</span><span>{n.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── Mobile Drawer ── */}
    {isMobile&&mobileOpen&&(<>
      <div onClick={()=>setMobileOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:148}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:260,background:"#fff",zIndex:149,overflowY:"auto",boxShadow:"4px 0 20px rgba(0,0,0,0.2)"}}>
        <div style={{background:C.green,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#fff",fontWeight:700}}>GSTAT AI</span>
          <button onClick={()=>setMobileOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {NAV_GROUPS.map(({group,items})=>(<div key={group}>
          <div style={{fontSize:10,color:C.muted,padding:"10px 16px 4px",fontWeight:700,letterSpacing:1,background:"#f8fafc"}}>{group}</div>
          {items.map(n=><button key={n.key} onClick={()=>go(n.key)}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 16px",border:"none",
              background:view===n.key?"#f0fdf4":"#fff",color:view===n.key?C.green:C.text,
              cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:view===n.key?700:400,
              borderLeft:view===n.key?`3px solid ${C.green}`:"3px solid transparent"}}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>)}
        </div>))}
      </div>
    </>)}

    {/* ── Breadcrumb ── */}
    <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"6px 16px",display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.muted,flexShrink:0}}>
      <span onClick={()=>go("dashboard")} style={{cursor:"pointer",color:C.green}}>🏠 Home</span>
      <span>›</span>
      <span style={{color:C.text,fontWeight:600}}>{currentLabel}</span>
    </div>

    {/* ── Main Content ── */}
    <div style={{flex:1,padding:isMobile?10:18,overflowY:"auto"}}>
      {view==="dashboard"    &&<GSTATDashboard token={token} toast={showToast} go={go}/>}
      {view==="clients"      &&<ClientManager token={token} toast={showToast}/>}
      {view==="cases"        &&<CaseList token={token} toast={showToast} go={go}/>}
      {view==="cases-new"    &&<CaseForm token={token} toast={showToast} go={go} onSaved={()=>go("cases")}/>}
      {view==="library"      &&<LegalLibrary token={token} toast={showToast} isAdmin={isAdmin}/>}
      {view==="appeals"      &&<AppealManager token={token} toast={showToast} go={go}/>}
      {view==="research"     &&<AIResearch token={token} toast={showToast}/>}
      {view==="chat"         &&<AIChat token={token} toast={showToast}/>}
      {view==="settings"     &&<UserSettings token={token} user={user} toast={showToast} onLogout={logout} isAdmin={isAdmin}/>}
      {view==="admin"        &&isAdmin&&<AdminPanel token={token} toast={showToast}/>}
    </div>

    {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function GSTATDashboard({token,toast,go}){
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{api("/dashboard","GET",null,token).then(d=>{setStats(d);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  if(loading)return<Spinner/>;
  const s=stats?.stats||{};
  return(<div>
    <div style={{...S.card,background:"linear-gradient(135deg,#0B6623 0%,#1a2b4e 100%)",border:"none",marginBottom:16}}>
      <div style={{color:"#fff",fontWeight:700,fontSize:16,marginBottom:4}}>⚖️ Welcome to GSTAT AI</div>
      <div style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>AI-Powered GST Litigation & Appeal Drafting — grounded in your Legal Library only</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:16}}>
      {[
        ["👥","Clients",s.total_clients,null,"clients"],
        ["📋","Total Cases",s.total_cases,null,"cases"],
        ["🔓","Open Cases",s.open_cases,null,"cases"],
        ["🚨","Critical",s.critical_deadline_cases,"red","cases"],
        ["✅","Filed",s.filed_cases,"green","cases"],
        ["💰","Total Demand",fR(s.total_demand),null,null],
      ].map(([icon,label,val,color,key])=>(
        <div key={label} onClick={()=>key&&go(key)} style={{...S.kpi,cursor:key?"pointer":"default",
          borderTop:`3px solid ${color==="red"?"#f85149":color==="green"?"#0B6623":C.green}`}}>
          <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
          <div style={{fontSize:18,fontWeight:800,color:color==="red"?"#c53030":color==="green"?"#0B6623":C.navy}}>{val??0}</div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{label}</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={S.card}>
        <div style={{fontWeight:700,color:C.text,marginBottom:10,fontSize:13}}>📋 Recent Cases</div>
        {stats?.recent_cases?.length>0?stats.recent_cases.map(c=>(
          <div key={c.id} onClick={()=>go("cases")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
            <div><div style={{fontSize:12,fontWeight:600,color:C.navy}}>{c.client_name}</div>
              <div style={{fontSize:10,color:C.muted}}>{c.case_number}</div></div>
            <div style={{textAlign:"right"}}>{badge((STATUS_CONFIG[c.status]?.label)||c.status,STATUS_CONFIG[c.status]?.color)}
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{fR(c.demand_total)}</div>
            </div>
          </div>
        )):<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>No cases yet. <span onClick={()=>go("cases-new")} style={{color:C.green,cursor:"pointer",textDecoration:"underline"}}>Create first case</span></div>}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,color:C.text,marginBottom:10,fontSize:13}}>📅 Upcoming Hearings</div>
        {stats?.upcoming_hearings?.length>0?stats.upcoming_hearings.map((h,i)=>(
          <div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.navy}}>{h.client_name}</div>
            <div style={{fontSize:11,color:C.muted}}>{h.case_number} · {fD(h.hearing_date)}</div>
            <div style={{fontSize:10,color:C.sub}}>{h.forum||"Court"}</div>
          </div>
        )):<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>No upcoming hearings</div>}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginTop:12}}>
      {[["👥","Clients","Manage client master, GSTINs, contacts","clients"],
        ["📋","Cases","Track appeals, hearings, deadlines","cases"],
        ["📚","Legal Library","Upload Act sections, Rules, Circulars, Court orders","library"],
        ["⚖️","Draft Appeal","AI drafts appeal citing your library only","appeals"],
        ["🔍","AI Research","Search your library by section, case, keyword","research"],
        ["💬","AI Chat","Ask legal questions — answered from your library","chat"],
      ].map(([icon,title,desc,key])=>(
        <div key={key} onClick={()=>go(key)}
          style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${C.green}`,background:"#fff"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(11,102,35,0.15)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
          <div style={{fontSize:26,marginBottom:6}}>{icon}</div>
          <div style={{fontWeight:700,color:C.text,marginBottom:3,fontSize:13}}>{title}</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{desc}</div>
        </div>
      ))}
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT MANAGER
// ══════════════════════════════════════════════════════════════════════════════
function ClientManager({token,toast}){
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
const REF_TYPES=[
  ["act_section","GST Act Section"],["rule","GST Rule"],["circular","CBIC Circular"],
  ["notification","Notification"],["gst_council","GST Council Recommendation"],
  ["gstat_order","GSTAT Order"],["hc_order","High Court Order"],
  ["sc_order","Supreme Court Order"],["aar","AAR / AAAR Order"],["user_upload","Own Upload / Research"],
];
const REF_COLORS={act_section:"blue",rule:"teal",circular:"purple",notification:"amber",
  gst_council:"green",gstat_order:"teal",hc_order:"blue",sc_order:"green",aar:"gray",user_upload:"gray"};

function LegalLibrary({token,toast,isAdmin}){
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
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:6,padding:16,maxHeight:500,overflowY:"auto",fontSize:12,lineHeight:1.8,color:"#1a1a1a",whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",marginTop:6}}>
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
const APPEAL_FORUMS=["GST Appellate Tribunal (GSTAT)","Commissioner (Appeals)","Additional Commissioner (Appeals)","High Court","Supreme Court"];
const ORDER_TYPES=["Order-in-Original (OIO)","Show Cause Notice (SCN)","DRC-07 (Summary Demand)","ASMT-13 (Best Judgement)","ADT-04 (Audit Report)","REG-19 (Cancellation)","Other"];

function AppealWorkspace({token,toast,appeal,onBack,onRefresh}){
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
function UserSettings({token,user,toast,onLogout,isAdmin}){
  const[f,setF]=useState({name:user?.name||"",firm_name:user?.firm_name||"",phone:user?.phone||""});
  const[cp,setCp]=useState({current:"",new_pass:"",confirm:""});
  const[saving,setSaving]=useState(false);const[adminKey,setAdminKey]=useState("");
  const saveProfile=async()=>{setSaving(true);try{await api("/auth/profile","PUT",f,token);toast("✅ Profile updated","success");}catch(e){toast(e.message,"error");}setSaving(false);};
  const changePass=async()=>{
    if(!cp.current||!cp.new_pass)return toast("Fill all fields","error");
    if(cp.new_pass!==cp.confirm)return toast("Passwords don't match","error");
    if(cp.new_pass.length<8)return toast("Min 8 characters","error");
    setSaving(true);try{await api("/auth/change-password","POST",{current_password:cp.current,new_password:cp.new_pass},token);toast("✅ Password changed. Please login again.","success");setTimeout(onLogout,2000);}catch(e){toast(e.message,"error");}setSaving(false);
  };
  const claimAdmin=async()=>{
    if(!adminKey)return toast("Enter setup key","error");
    try{await api("/admin/claim","POST",{setup_key:adminKey},token);toast("✅ Admin access granted! Refresh page.","success");setTimeout(()=>window.location.reload(),2000);}catch(e){toast(e.message,"error");}
  };

  return(<div>
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>👤 Profile Settings</div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Full Name</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Firm Name</label><input style={S.input} value={f.firm_name} onChange={e=>setF(p=>({...p,firm_name:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Email (cannot change)</label><input style={{...S.input,background:"#f8fafc",color:C.muted}} value={user?.email||""} disabled/></div>
        <div style={S.fg}><label style={S.label}>Mobile Number</label><input style={S.input} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))}/></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={saveProfile} disabled={saving} style={S.btn}>{saving?"Saving…":"Save Profile"}</button>
        <button onClick={onLogout} style={{...S.btnR,marginLeft:"auto"}}>Logout</button>
      </div>
    </div>
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>🔐 Change Password</div>
      <div style={S.fg}><label style={S.label}>Current Password</label><input type="password" style={S.input} value={cp.current} onChange={e=>setCp(p=>({...p,current:e.target.value}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>New Password (min 8 chars)</label><input type="password" style={S.input} value={cp.new_pass} onChange={e=>setCp(p=>({...p,new_pass:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Confirm New Password</label><input type="password" style={S.input} value={cp.confirm} onChange={e=>setCp(p=>({...p,confirm:e.target.value}))}/></div>
      </div>
      <button onClick={changePass} disabled={saving} style={S.btn}>Change Password</button>
    </div>
    {!isAdmin&&(<div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>👑 Admin Setup (one-time)</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>If you are the platform owner, enter the ADMIN_SETUP_KEY from your Render environment to claim admin access.</div>
      <div style={{display:"flex",gap:8}}>
        <input type="password" style={{...S.input,flex:1}} value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="Enter ADMIN_SETUP_KEY"/>
        <button onClick={claimAdmin} style={S.btn}>Claim Admin</button>
      </div>
    </div>)}
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>ℹ️ Account Info</div>
      <div style={{fontSize:12,color:C.sub,lineHeight:2}}>
        <div>Email: <b>{user?.email}</b></div>
        <div>Role: <b>{user?.role?.toUpperCase()}</b></div>
        <div>Plan: <b>{user?.plan?.toUpperCase()||"STARTER"}</b></div>
        <div>Admin: <b>{isAdmin?"Yes ✅":"No"}</b></div>
      </div>
    </div>
  </div>);
}

function AdminPanel({token,toast}){
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{api("/admin/stats","GET",null,token).then(d=>{setStats(d);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  const suspend=async(id,val)=>{try{await api(`/admin/users/${id}/suspend`,"POST",{suspended:val},token);toast(`✅ User ${val?"suspended":"unsuspended"}`,"success");api("/admin/stats","GET",null,token).then(d=>setStats(d)).catch(()=>{});}catch(e){toast(e.message,"error");}};
  if(loading)return<Spinner/>;
  const s=stats?.stats||{};
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:14}}>
      {[["👥","Users",s.total_users],["👥","Clients",s.total_clients],["📋","Cases",s.total_cases],["⚖️","Appeals",s.total_appeals],["📚","Library Refs",s.total_legal_refs]].map(([icon,label,val])=>(
        <div key={label} style={{...S.kpi,borderTop:`3px solid ${C.green}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
          <div style={{fontSize:18,fontWeight:800,color:C.navy}}>{val||0}</div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{label}</div>
        </div>
      ))}
    </div>
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Recent Users</div>
      <table style={S.tbl}><thead><tr>{["Name","Email","Role","Plan","Last Active","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{(stats?.recent_users||[]).map(u=>(
        <tr key={u.id}>
          <td style={{...S.td,fontWeight:600}}>{u.name}</td>
          <td style={{...S.td,fontSize:11}}>{u.email}</td>
          <td style={S.td}>{badge(u.role?.toUpperCase()||"CA","blue")}</td>
          <td style={S.td}>{badge(u.plan?.toUpperCase()||"STARTER","gray")}</td>
          <td style={{...S.td,fontSize:11}}>{u.last_active_at?new Date(u.last_active_at).toLocaleDateString("en-IN"):"Never"}</td>
          <td style={S.td}>{badge(u.is_suspended?"Suspended":"Active",u.is_suspended?"red":"green")}</td>
          <td style={S.tdR}>
            <button onClick={()=>suspend(u.id,!u.is_suspended)} style={{...u.is_suspended?S.btn:S.btnR,fontSize:10,padding:"3px 8px"}}>
              {u.is_suspended?"Unsuspend":"Suspend"}
            </button>
          </td>
        </tr>
      ))}</tbody></table>
    </div>
  </div>);
}