// pdfkit publie trois builds. Le point d'entrée par défaut (`pdfkit`) lit ses métriques de police
// (.afm) sur le disque, au runtime, par un chemin construit à l'exécution : le traceur de fichiers
// de Next ne peut pas le voir, et la production répond
// `ENOENT ... pdfkit/js/data/Helvetica.afm`. La variante `pdfkit.standalone.js` embarque ces
// métriques dans un système de fichiers virtuel et ne touche jamais au disque.
//
// Elle n'a pas de types : cette déclaration lui prête ceux de `@types/pdfkit`, qui décrivent la
// même API. Le runtime change, le contrat non.
declare module "pdfkit/js/pdfkit.standalone.js" {
  import PDFDocument from "pdfkit";
  export default PDFDocument;
}
