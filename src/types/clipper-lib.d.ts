// `clipper-lib` (Clipper 6.4.2 d'Angus Johnson, traduit en JavaScript, licence Boost) n'a pas de types.
// Cette déclaration ne décrit que ce que `geometrie-parcelle.ts` utilise : une opération booléenne sur
// des polygones à coordonnées ENTIÈRES, et l'aire d'un chemin.
declare module "clipper-lib" {
  type IntPoint = { X: number; Y: number };
  type Path = IntPoint[];
  type Paths = Path[];
  interface Clipper {
    AddPaths(paths: Paths, polyType: number, closed: boolean): boolean;
    Execute(clipType: number, solution: Paths, subjFillType: number, clipFillType: number): boolean;
  }
  const ClipperLib: {
    Clipper: { new (): Clipper; Area(path: Path): number };
    ClipType: { ctIntersection: number; ctUnion: number };
    PolyType: { ptSubject: number; ptClip: number };
    PolyFillType: { pftNonZero: number };
  };
  export default ClipperLib;
}
