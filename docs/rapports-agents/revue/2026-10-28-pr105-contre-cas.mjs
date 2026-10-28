import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fibreDeLaCommune,partEntiere} from '../../../src/lib/data/arcep-fibre.ts';
import {texteFibre,ligneComparateur} from '../../../src/lib/fibre-texte.ts';
const table=JSON.parse(fs.readFileSync('data/arcep-fibre.json'));
const normalise=s=>s.replaceAll('\u00a0',' ');
let measured=0,zeroLocaux=0;
for(const [code,[total,ftth]] of Object.entries(table.communes)) {
 const lecture=fibreDeLaCommune(table,code);
 if(total===0){assert.equal(lecture.etat,'sans_locaux');assert.equal(texteFibre(lecture).valeur,'—');zeroLocaux++;continue;}
 assert.equal(lecture.etat,'mesuree');
 const expected=ftth===0?0:ftth===total?100:Math.max(1,Math.min(99,Math.floor(100*ftth/total+0.5)));
 assert.equal(partEntiere(total,ftth),expected,code);
 const text=texteFibre(lecture);
 assert.match(normalise(text.limite),/ne garantit pas que le logement/);
 assert.match(text.source,/échelle communale/);
 if(ftth===0)assert.match(ligneComparateur(lecture),/d'autres accès à Internet peuvent exister/);
 measured++;
}
for(const code of ['00000','99999','__proto__','97501']) {
 const lecture=fibreDeLaCommune(table,code);assert.equal(lecture.etat,'absente');assert.equal(texteFibre(lecture).valeur,'—');
}
assert.equal(fibreDeLaCommune(table,'54524').etat,'discordante');
const amended=structuredClone(table);
amended.discordantes['75101']={fichierCommune:[1,1],observatoire:[2,1]};
assert.equal(fibreDeLaCommune(amended,'75056').etat,'discordante');
delete amended.discordantes['75101'];delete amended.communes['75101'];
assert.equal(fibreDeLaCommune(amended,'75056').etat,'absente');
const summary={measuredCommunes:measured,zeroLocaux,missingProbes:4,discordance:1,PLMAdversarial:2};
fs.writeFileSync('docs/rapports-agents/revue/2026-10-28-pr105-contre-cas.json',JSON.stringify(summary,null,2)+'\n');
console.log(summary);
