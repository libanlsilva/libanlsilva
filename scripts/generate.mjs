import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const DAY=86400000;
const dateAt=(start,i)=>new Date(Date.parse(start+'T00:00:00Z')+i*DAY).toISOString().slice(0,10);
const text=(x,y,value,cls='body',extra='')=>`<text x="${x}" y="${y}" class="${cls}" ${extra}>${escape(value)}</text>`;
const C={panel:'#131c2e',line:'#2b3b55',text:'#e6edf3',muted:'#9baac1',violet:'#ad9bff',cyan:'#67d9ed',gold:'#efc477'};
const labels={es:{stack:'Con lo que construyo',activity:'Un año construyendo',total:'contribuciones',active:'días con actividad',streak:'mejor racha · días',level:'nivel',personal:'XP personal',path:'Una contribución, una conexión.',paused:'Animación pausada',months:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']},en:{stack:'What I build with',activity:'A year of building',total:'contributions',active:'active days',streak:'longest streak · days',level:'level',personal:'Personal XP',path:'One contribution, one connection.',paused:'Animation paused',months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}};
export function normalizeActivity(input){
 if(!input||!/^\d{4}-\d{2}-\d{2}$/.test(input.start)||!Array.isArray(input.counts)||!input.counts.length)throw new Error('Activity needs a start date and daily counts.');
 if(!Number.isFinite(Date.parse(input.start+'T00:00:00Z'))||dateAt(input.start,0)!==input.start)throw new Error('Invalid start date.');
 if(!input.counts.every(n=>Number.isSafeInteger(n)&&n>=0))throw new Error('Contribution counts must be non-negative integers.');
 const end=dateAt(input.start,input.counts.length-1),total=input.counts.reduce((a,b)=>a+b,0);
 if(input.end&&end!==input.end)throw new Error(`Calendar end mismatch: ${end} != ${input.end}`);
 if(input.total!==undefined&&total!==input.total)throw new Error(`Contribution total mismatch: ${total} != ${input.total}`);
 return {...input,end,total};
}
export function summarize(raw){
 const d=normalizeActivity(raw);let run=0,longest=0,active=0;
 for(const n of d.counts){run=n?run+1:0;longest=Math.max(longest,run);if(n)active++;}
 const xp=d.total+3*active,level=Math.floor(Math.sqrt(xp/100))+1,low=100*(level-1)**2,high=100*level**2;
 return {total:d.total,active,longest,xp,level,fraction:(xp-low)/(high-low),next:high-xp};
}
function svg(w,h,title,body,{motion=true}={}){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${escape(title)}</title><desc id="desc">${escape(title)}. Liban Velazquez Silva.</desc><defs><linearGradient id="accent"><stop stop-color="${C.violet}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#456080" opacity=".26"/></pattern></defs><style>text{font-family:'Segoe UI',Arial,sans-serif;fill:${C.text}}.body{font-size:16px}.small{font-size:12px;fill:${C.muted}}.code{font-family:Consolas,monospace;font-size:13px;fill:${C.muted}}.title{font-size:21px;font-weight:650}.metric{font-size:38px;font-weight:650}.name{font-size:56px;font-weight:700;letter-spacing:-2px}.subname{font-size:30px;font-weight:550;letter-spacing:-.5px}.mono{font-family:Consolas,monospace;font-size:14px}.packet{offset-rotate:0deg;animation:travel 28s linear infinite}@keyframes travel{from{offset-distance:0%}to{offset-distance:100%}}@media(prefers-reduced-motion:reduce){.packet{display:none}}${motion?'':'.packet{display:none}'}</style><rect x=".5" y=".5" width="${w-1}" height="${h-1}" rx="14" fill="${C.panel}" stroke="${C.line}"/>${body}</svg>`;
}
export function banner(p){
 return svg(900,268,'Liban Velazquez Silva · Full-stack & mobile developer',`<rect x="1" y="1" width="898" height="266" rx="14" fill="url(#dots)"/><path d="M1 252V15Q1 1 15 1H885Q899 1 899 15" fill="none" stroke="url(#accent)" stroke-opacity=".65"/>${text(32,37,'<libanlsilva />','mono',`style="fill:${C.cyan}"`)}${text(32,106,'Liban','name')}${text(34,147,'Velazquez Silva','subname')}${text(34,183,p.role)}${text(34,222,'Python  /  TypeScript  /  C#  /  Dart','code')}<g transform="translate(530 34)"><rect width="337" height="198" rx="11" fill="#0d1423" stroke="${C.line}"/>${text(17,26,'services → interfaces → apps','code')}<path d="M70 77H265M166 77V131" fill="none" stroke="url(#accent)"/><circle cx="70" cy="77" r="25" fill="#27213f" stroke="${C.violet}"/><circle cx="166" cy="77" r="25" fill="#153240" stroke="${C.cyan}"/><circle cx="265" cy="77" r="25" fill="#342d24" stroke="${C.gold}"/>${text(70,83,'{ }','title','text-anchor="middle"')}${text(166,83,'</>','title','text-anchor="middle"')}${text(265,83,'▣','title','text-anchor="middle"')}${text(70,120,'Python · .NET','small','text-anchor="middle"')}${text(166,148,'TypeScript · React','small','text-anchor="middle"')}${text(265,120,'Flutter · MAUI','small','text-anchor="middle"')}<circle cx="22" cy="176" r="3" fill="${C.cyan}"/>${text(33,180,'from an idea to a working product','small')}</g>`);
}
export function stackSvg(p,lang){
 const s=labels[lang];let b=text(26,34,s.stack,'title')+text(874,34,'Python / Web / Mobile','code','text-anchor="end"');
 p.stack.forEach((g,i)=>{const x=26+i*291;b+=`<circle cx="${x+4}" cy="70" r="4" fill="${g.color}"/>`+text(x+18,75,lang==='es'?g.label:g.en);if(i<2)b+=`<path d="M${x+272} 59V155" stroke="${C.line}"/>`;let cx=x,cy=104;for(const item of g.items){const w=item.length*8+24;if(cx+w>x+266){cx=x;cy+=34;}b+=`<rect x="${cx}" y="${cy-18}" width="${w}" height="27" rx="5" fill="#0d1423" stroke="${g.color}" stroke-opacity=".45"/>`+text(cx+12,cy,item,'mono');cx+=w+8;}});
 return svg(900,182,s.stack,b);
}
export function statsSvg(raw,lang){
 const d=normalizeActivity(raw),m=summarize(d),s=labels[lang];let b=text(26,34,s.activity,'title')+text(874,34,`${d.start} — ${d.end}`,'code','text-anchor="end"');
 [[m.total,s.total],[m.active,s.active],[m.longest,s.streak]].forEach(([value,label],i)=>{const x=26+i*206;b+=text(x,91,value,'metric')+text(x,116,label,'small');});
 b+=`<path d="M657 58V170" stroke="${C.line}"/>`+text(690,73,`${s.level} ${m.level}`,'title',`style="fill:${C.violet}"`)+text(690,101,`${m.xp} ${s.personal}`,'small')+`<rect x="690" y="114" width="183" height="7" rx="3.5" fill="#29354b"/><rect x="690" y="114" width="${(183*m.fraction).toFixed(2)}" height="7" rx="3.5" fill="url(#accent)"/>`+text(690,145,`${m.next} XP → ${s.level} ${m.level+1}`,'small')+text(26,160,lang==='es'?`Captura: ${d.capturedAt} · Actividad visible en GitHub`:`Captured: ${d.capturedAt} · Activity visible on GitHub`,'small');
 return svg(900,184,s.activity,b);
}
export function activitySvg(raw,lang,motion=true){
 const d=normalizeActivity(raw),s=labels[lang],offset=new Date(d.start+'T00:00:00Z').getUTCDay(),weeks=Math.ceil((offset+d.counts.length)/7),cell=Math.min(15,790/weeks),left=64,top=79,size=11,colors=['#202b40','#344971','#5968a9','#8b85d7','#b8a6ff'];
 let b=text(26,33,lang==='es'?'Circuito de contribuciones':'Contribution circuit','title')+text(874,33,`${d.total} ${s.total}`,'code','text-anchor="end"'),month=-1;
 d.counts.forEach((n,i)=>{const date=dateAt(d.start,i),day=new Date(date+'T00:00:00Z'),week=Math.floor((i+offset)/7),row=(i+offset)%7,x=left+week*cell,y=top+row*18,lv=n===0?0:n<=3?1:n<=9?2:n<=19?3:4;if(row===0&&day.getUTCMonth()!==month){month=day.getUTCMonth();if(week<weeks-2)b+=text(x,64,s.months[month],'small');}b+=`<rect x="${x.toFixed(2)}" y="${y}" width="${size}" height="${size}" rx="3" fill="${colors[lv]}"><title>${date}: ${n} ${s.total}</title></rect>`;});
 for(const [r,l]of [[1,lang==='es'?'lun':'Mon'],[3,lang==='es'?'mié':'Wed'],[5,lang==='es'?'vie':'Fri']])b+=text(26,top+r*18+9,l,'small');
 const route=[];for(let r=0;r<7;r++){const a=left+size/2,z=left+(weeks-1)*cell+size/2,y=top+r*18+size/2;if(r===0)route.push(`M${a.toFixed(2)} ${y}`);route.push(`L${(r%2===0?z:a).toFixed(2)} ${y}`);if(r<6)route.push(`L${(r%2===0?z:a).toFixed(2)} ${y+18}`);}
 if(motion)b+=`<g class="packet" style="offset-path:path('${route.join(' ')}')"><circle r="9" fill="${C.cyan}" opacity=".14"/><rect x="-5" y="-5" width="10" height="10" rx="2" fill="${C.cyan}"/><path d="M-2 0H2M0-2V2" stroke="#0d1423" stroke-width="1.4"/></g>`;
 b+=text(26,237,motion?s.path:s.paused,'small')+text(689,237,lang==='es'?'Menos':'Less','small');colors.forEach((c,i)=>b+=`<rect x="${734+i*19}" y="226" width="12" height="12" rx="3" fill="${c}"/>`);b+=text(835,237,lang==='es'?'Más':'More','small');return svg(900,261,lang==='es'?'Calendario real de contribuciones':'Real contribution calendar',b,{motion});
}
function readme(p,lang,d){
 const en=lang==='en',suffix=en?'-en':'';const rows=[`<picture><source media="(max-width: 600px)" srcset="assets/banner-mobile.svg"><img src="assets/banner.svg" alt="${escape(p.name)} · Full-stack & mobile developer" width="900"></picture>`,'',`**${en?'Hi, I’m Liban.':'Hola, soy Liban.'}** ${p.bio[lang]}`,'',`<picture><source media="(max-width: 600px)" srcset="assets/stack${suffix}-mobile.svg"><img src="assets/stack${suffix}.svg" alt="Python, C#, .NET, TypeScript, React, Flutter, Dart, .NET MAUI, Android" width="900"></picture>`,'',`### ${en?'Things I build':'Lo que construyo'}`,''];
 for(const x of p.projects)rows.push(`**[${x.name}](https://github.com/${p.username}/${x.repo})**`,x[en?'en':'description'],`\n${x.tags}\n`);
 rows.push(p.collaboration[lang],'',`### ${en?'Activity':'Actividad'}`,'',`<picture><source media="(max-width: 600px)" srcset="assets/stats${suffix}-mobile.svg"><img src="assets/stats${suffix}.svg" alt="${en?'Contribution statistics':'Estadísticas de contribuciones'}" width="900"></picture>`,`<img src="assets/activity${suffix}.svg" alt="${en?'Animated contribution calendar':'Calendario animado de contribuciones'}" width="900">`,'',`<sub>${en?'Snapshot captured':'Instantánea capturada'}: ${d.capturedAt}. ${en?'Personal XP = contributions + 3 × active days.':'XP personal = contribuciones + 3 × días activos.'}</sub>`,'',`[${en?'Explore my repositories':'Explora mis repositorios'}](https://github.com/${p.username}?tab=repositories)`,'');return rows.join('\n');
}
export async function fetchActivity(username,token){
 if(!/^[a-zA-Z0-9-]{1,39}$/.test(username))throw new Error('Invalid GitHub username.');
 const response=await fetch('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','User-Agent':'liban-profile-cards'},body:JSON.stringify({query:'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}',variables:{login:username}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`GitHub request failed (${response.status}).`);const payload=await response.json();if(payload.errors||!payload.data?.user)throw new Error('GitHub could not return the contribution calendar.');
 const cal=payload.data.user.contributionsCollection.contributionCalendar,days=cal.weeks.flatMap(w=>w.contributionDays).sort((a,b)=>a.date.localeCompare(b.date));
 for(let i=1;i<days.length;i++)if(dateAt(days[0].date,i)!==days[i].date)throw new Error('GitHub returned a discontinuous calendar.');
 return normalizeActivity({start:days[0].date,end:days.at(-1).date,counts:days.map(x=>x.contributionCount),total:cal.totalContributions,capturedAt:new Date().toISOString().slice(0,10),source:`https://github.com/${username}`,mode:'snapshot'});
}
export async function generate({refresh=false}={}){
 const p=JSON.parse(await readFile(path.join(ROOT,'profile.json'),'utf8'));let d=normalizeActivity(JSON.parse(await readFile(path.join(ROOT,'data/activity.json'),'utf8')));
 if(refresh){if(!process.env.GITHUB_TOKEN)throw new Error('Set GITHUB_TOKEN to refresh real data. The existing snapshot has been preserved.');d=await fetchActivity(p.username,process.env.GITHUB_TOKEN);await writeFile(path.join(ROOT,'data/activity.json'),JSON.stringify(d,null,2)+'\n');}
 await mkdir(path.join(ROOT,'assets'),{recursive:true});await writeFile(path.join(ROOT,'assets/banner.svg'),banner(p));await writeFile(path.join(ROOT,'assets/banner-mobile.svg'),bannerMobile(p));
 for(const lang of ['es','en']){const s=lang==='es'?'':'-en';await writeFile(path.join(ROOT,`assets/stack${s}-mobile.svg`),stackMobile(p,lang));await writeFile(path.join(ROOT,`assets/stats${s}-mobile.svg`),statsMobile(d,lang));await writeFile(path.join(ROOT,`assets/stack${s}.svg`),stackSvg(p,lang));await writeFile(path.join(ROOT,`assets/stats${s}.svg`),statsSvg(d,lang));for(const motion of [true,false])await writeFile(path.join(ROOT,`assets/activity${s}${motion?'':'-static'}.svg`),activitySvg(d,lang,motion));await writeFile(path.join(ROOT,lang==='es'?'README.es.md':'README.md'),readme(p,lang,d));}
 await writeFile(path.join(ROOT,'README.en.md'),readme(p,'en',d));
 await mkdir(path.join(ROOT,'preview'),{recursive:true}); await writeFile(path.join(ROOT,'preview/profile-data.js'),'window.PROFILE = '+JSON.stringify({profile:p,activity:d})+';\n');
 console.log(`Generated profile: ${d.total} contributions, ${summarize(d).active} active days; snapshot ${d.capturedAt}.`);return {profile:p,data:d};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)generate({refresh:process.argv.includes('--refresh')}).catch(e=>{console.error(e.message);process.exitCode=1;});


function bannerMobile(p){
 return svg(450,252,'Liban Velazquez Silva · Full-stack & mobile developer',`<rect x="1" y="1" width="448" height="250" rx="14" fill="url(#dots)"/>${text(24,35,'<libanlsilva />','mono',`style="fill:${C.cyan}"`)}${text(22,108,'Liban','name')}${text(25,149,'Velazquez Silva','subname')}${text(25,187,p.role)}${text(25,220,'Python / TypeScript / C# / Dart','code')}`);
}
function stackMobile(p,lang){
 let b=text(24,35,labels[lang].stack,'title');
 p.stack.forEach((g,i)=>{const y=76+i*88;b+=`<circle cx="28" cy="${y-5}" r="4" fill="${g.color}"/>`+text(42,y,lang==='es'?g.label:g.en);let x=24;for(const item of g.items){const w=item.length*8+24;b+=`<rect x="${x}" y="${y+13}" width="${w}" height="28" rx="5" fill="#0d1423" stroke="${g.color}" stroke-opacity=".5"/>`+text(x+12,y+32,item,'mono');x+=w+8;}});
 return svg(450,309,labels[lang].stack,b);
}
function statsMobile(d,lang){
 const m=summarize(d),s=labels[lang];let b=text(24,34,s.activity,'title');
 [[m.total,s.total],[m.active,s.active],[m.longest,s.streak]].forEach(([v,l],i)=>{const x=24+i*140;b+=text(x,94,v,'metric')+text(x,120,l,'small');});
 b+=`<path d="M24 142H426" stroke="${C.line}"/>`+text(24,177,`${s.level} ${m.level}`,'title',`style="fill:${C.violet}"`)+text(426,174,`${m.xp} ${s.personal}`,'small','text-anchor="end"')+`<rect x="24" y="193" width="402" height="7" rx="3.5" fill="#29354b"/><rect x="24" y="193" width="${402*m.fraction}" height="7" rx="3.5" fill="url(#accent)"/>`+text(24,228,`${lang==='es'?'Captura':'Captured'}: ${d.capturedAt}`,'small');
 return svg(450,249,s.activity,b);
}

