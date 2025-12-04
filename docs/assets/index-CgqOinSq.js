const l={manifest:{id:"example.ui",name:"Example UI Plugin",version:"0.0.1",description:"Adds a simple side panel via plugin API"},install(n){return{onUnmount:n.ui.registerPanel("example.panel",{title:"Example Panel",position:"right",mount(i){const e=document.createElement("div");return e.style.padding="12px",e.innerHTML=`<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
          <strong>Example Plugin</strong>
          <p style="margin:6px 0 0 0;">This panel was created by a plugin.</p>
        </div>`,i.appendChild(e),()=>i.removeChild(e)}})}}};export{l as default};
