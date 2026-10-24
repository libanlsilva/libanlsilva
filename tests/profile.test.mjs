import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeActivity,summarize,escape,activitySvg,banner,stackSvg} from '../scripts/generate.mjs';
const data=JSON.parse(await readFile(new URL('../data/activity.json',import.meta.url),'utf8'));
const profile=JSON.parse(await readFile(new URL('../profile.json',import.meta.url),'utf8'));
test('Real snapshot has continuous dates and matches the visible GitHub total',()=>{
 const d=normalizeActivity(data);assert.equal(d.total,data.total);assert.equal(d.end,data.end);assert.equal(d.counts.length,Math.round((Date.parse(d.end)-Date.parse(d.start))/86400000)+1);assert.equal(summarize(d).active,d.counts.filter(n=>n>0).length);
});
test('Streak calculation handles zeros and runs at either calendar edge',()=>{
 const s=summarize({start:'2026-01-01',counts:[1,2,0,4,1,1]});assert.equal(s.longest,3);assert.equal(s.active,5);assert.equal(s.total,9);assert.ok(s.fraction>=0&&s.fraction<1);
 assert.equal(summarize({start:'2026-01-01',counts:[0,0]}).longest,0);
});
test('Bad data cannot silently produce plausible-looking statistics',()=>{
 assert.throws(()=>normalizeActivity({...data,total:data.total+1}),/total mismatch/);
 assert.throws(()=>normalizeActivity({...data,end:'2000-01-01'}),/end mismatch/);
 assert.throws(()=>normalizeActivity({start:'2026-01-01',counts:[-1]}),/non-negative/);
 assert.throws(()=>normalizeActivity({start:'2026-02-30',counts:[1]}),/Invalid start/);
});
test('User-controlled text is escaped before embedding into SVG',()=>{
 assert.equal(escape('<script a="x">&'), '&lt;script a=&quot;x&quot;&gt;&amp;');
 const hostile=banner({...profile,role:'<script>alert(1)</script>'});assert.ok(!hostile.includes('<script>'));assert.ok(hostile.includes('&lt;script&gt;'));
});
test('Activity assets use real date/count pairs and provide reduced motion',()=>{
 const moving=activitySvg(data,'es'),paused=activitySvg(data,'es',false);
 assert.equal((moving.match(/<title>\d{4}-/g)||[]).length,data.counts.length);
 assert.ok(moving.includes(`${data.start}: ${data.counts[0]} contribuciones`));
 assert.ok(moving.includes('offset-path:path('));assert.ok(!paused.includes('<g class="packet"'));
 assert.ok(moving.includes('prefers-reduced-motion'));assert.ok(!moving.includes('<script'));
});
test('The stack includes organizational web work and mobile frameworks without fake ratings',()=>{
 const svg=stackSvg(profile,'es');for(const name of ['Python','TypeScript','React','Flutter','Dart','.NET MAUI'])assert.ok(svg.includes(name));assert.ok(!/<text[^>]*>[^<]*%/.test(svg));
});

