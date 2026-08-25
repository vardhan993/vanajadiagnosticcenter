/* ============================================================
   VANAJA AI — LLM CONNECTOR (OpenRouter)
   - Key is entered by the user in-app, stored ONLY in their
     browser localStorage. Never shipped in source.
   - Medical safety system prompt enforced on every call.
   - Falls back to the built-in demo KB when no key is set.
   ============================================================ */
(function(){
  const CFG_KEY='vd_ai_cfg';
  const DEFAULTS={ provider:'openrouter', model:'openai/gpt-4o-mini', key:'' };
  window.VanajaAI={
    cfg(){ try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')};}catch(_){return {...DEFAULTS};} },
    save(patch){ const c=this.cfg(); Object.assign(c,patch); localStorage.setItem(CFG_KEY,JSON.stringify(c)); },

    hasKey(){ return !!this.cfg().key; },

    /* Settings panel — injects a ⚙ button target; call renderSettings(elId) */
    renderSettings(elId){
      const el=document.getElementById(elId); if(!el) return;
      const c=this.cfg();
      el.innerHTML=`
        <details style="margin-top:.8rem">
          <summary style="cursor:pointer;font-weight:800;font-size:.88rem">⚙️ Live AI engine (OpenRouter)</summary>
          <div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.7rem">
            <label style="font-size:.84rem">API key
              <input class="input" type="password" id="vaiKey" placeholder="sk-or-v1-…" value="${c.key?'•••• saved ••••':''}" autocomplete="off"></label>
            <label style="font-size:.84rem">Model
              <select class="input" id="vaiModel">
                ${['openai/gpt-4o-mini','openai/gpt-4o','anthropic/claude-3.5-haiku','anthropic/claude-sonnet-4','google/gemini-flash-1.5','meta-llama/llama-3.3-70b-instruct','stealth/ox-alpha']
                  .map(m=>`<option value="${m}" ${m===c.model?'selected':''}>${m}</option>`).join('')}
              </select></label>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-primary btn-sm" id="vaiSave">Save & go live</button>
              <button class="btn btn-ghost btn-sm" id="vaiClear">Remove key</button>
            </div>
            <small style="color:var(--ink-faint)">Key is stored only in this browser (localStorage) and sent directly
            to OpenRouter over HTTPS. Without a key, the assistant runs in offline demo mode.</small>
            <small id="vaiStatus" style="font-weight:700;color:${this.hasKey()?'#1E7A54':'var(--ink-faint)'}">
              ${this.hasKey()?'● Live LLM active ('+c.model+')':'○ Offline demo mode'}</small>
          </div>
        </details>`;
      el.querySelector('#vaiSave').onclick=()=>{
        const k=el.querySelector('#vaiKey').value.trim();
        this.save({key:k||c.key, model:el.querySelector('#vaiModel').value});
        toast&&toast(k?'Live AI enabled ✓':'Kept existing key'); this.renderSettings(elId);
      };
      el.querySelector('#vaiClear').onclick=()=>{ this.save({key:''}); toast&&toast('Key removed — offline mode'); this.renderSettings(elId); };
    },

    /* Medical guardrail system prompt — always prepended */
    systemPrompt(lang){
      const langLine={en:'Respond in clear, simple English.',
                      te:'తెలుగులో సరళమైన భాషలో స్పందించండి.',
                      hi:'सरल हिंदी में उत्तर दें।'}[lang]||'Respond in simple English.';
      return `You are "Vanaja AI", the health-information assistant of Vanaja Diagnostic Centre (Hyderabad, ISO 9001:2015).
STRICT RULES:
1. You are NOT a doctor. Never diagnose, never state certainty about causes, never predict disease.
2. Explain lab values educationally: what the test measures, what being high/low generally indicates, and why discussing results with a qualified doctor matters.
3. If the user mentions emergency symptoms (chest pain, breathlessness, heavy bleeding, stroke signs, self-harm), STOP and tell them to call 108 (or Tele-MANAS 14416 for mental-health crisis) immediately.
4. Only reference Vanaja tests/packages that exist in the provided catalogue context; prices are indicative INR.
5. Keep answers under ~180 words, warm and plain-language. End every answer with one short line: "AI information only — please consult your doctor for advice."
${langLine}`;
    },

    /* Main entry: messages=[{role,content}…], ctx={reportText,lang} */
    async chat(messages,{lang='en',reportContext=''}={}){
      const c=this.cfg();
      if(!c.key) throw new Error('no-key');
      const sys=this.systemPrompt(lang)+(reportContext?`\n\nPATIENT REPORT CONTEXT (use only this):\n${reportContext}`:'');
      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer '+c.key,
          'HTTP-Referer':location.origin||'https://vanajadiagnosticcenter.com',
          'X-Title':'Vanaja Diagnostic Centre App' },
        body:JSON.stringify({ model:c.model, temperature:.4, max_tokens:500,
          messages:[{role:'system',content:sys},...messages] })
      });
      if(!res.ok){ const t=await res.text().catch(()=>''); throw new Error('openrouter-'+res.status+': '+t.slice(0,140)); }
      const data=await res.json();
      const out=data.choices?.[0]?.message?.content?.trim();
      if(!out) throw new Error('empty-response');
      return out;
    }
  };
})();
