function dijkstra(graph, source, target) {
  const dist = {};
  const prev = {};
  const prevEdge = {};
  const visited = {};
  const steps = [];

  const snapshot = () => ({ dist: { ...dist }, prev: { ...prev }, visited: { ...visited } });

  for (const v of graph.nodes) {
    dist[v] = Infinity;
    prev[v] = null;
    prevEdge[v] = null;
    visited[v] = false;
  }
  dist[source] = 0;
  steps.push({ type: 'init', source: source, ...snapshot() });

  while (true) {
    let u = null;
    for (const v of graph.nodes) {
      if (!visited[v] && dist[v] !== Infinity && (u === null || dist[v] < dist[u])) {
        u = v;
      }
    }

    if (u === null) break;

    visited[u] = true;
    steps.push({ type: 'select', u: u, d: dist[u], ...snapshot() });

    if (u === target) break;

    for (const edge of graph.adj[u]) {
      const v = edge.to;
      if (visited[v]) {
        steps.push({ type: 'skip', u: u, v: v, ...snapshot() });
        continue;
      }
      const oldDist = dist[v];
      const newDist = dist[u] + edge.weight;
      const updated = newDist < oldDist;
      if (updated) {
        dist[v] = newDist;
        prev[v] = u;
        prevEdge[v] = edge;
      }
      steps.push({
        type: 'relax', u: u, v: v, w: edge.weight,
        oldDist: oldDist, newDist: newDist, updated: updated, ...snapshot()
      });
    }
  }

  const path = [];
  const legs = [];
  if (dist[target] !== Infinity) {
    for (let v = target; v !== null; v = prev[v]) {
      path.unshift(v);
      if (prevEdge[v]) legs.unshift(prevEdge[v].flight);
    }
    steps.push({ type: 'path', path: path.slice(), total: dist[target], ...snapshot() });
  } else {
    steps.push({ type: 'unreachable', ...snapshot() });
  }

  return { dist: dist, prev: prev, path: path, legs: legs, total: dist[target], steps: steps };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dijkstra };
}
