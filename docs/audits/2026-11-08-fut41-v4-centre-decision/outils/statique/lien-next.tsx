// Remplace `next/link` dans la version statique : un lien HTML ordinaire.
import type { AnchorHTMLAttributes, ReactNode } from "react";
export default function Link({ href, children, ...reste }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean }) {
  const { prefetch: _p, ...attrs } = reste as typeof reste & { prefetch?: boolean };
  void _p;
  return <a href={href} {...attrs}>{children}</a>;
}
