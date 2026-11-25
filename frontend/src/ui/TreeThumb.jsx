import { useEffect, useRef } from 'react';
import { buildTree } from '../recursion/tree';
import { compose } from '../music/compose';
import { createRenderer } from '../visual/renderer';

/** Static, fully grown preview of a garden for gallery cards. */
export default function TreeThumb({ params, season, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const r = createRenderer(ref.current, { ring: false });
    const tree = buildTree(params);
    r.resize();
    r.setScene(tree, compose(tree, params, season, 'bloom'), season, { reduced: true, wind: 0 });
    r.frame(1e9, { started: true });
  }, [params, season]);
  return <canvas ref={ref} className="thumb" role="img" aria-label={label} />;
}
