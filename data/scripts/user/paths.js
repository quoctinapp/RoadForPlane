function findAllPaths(graph, from, to, maxLegs) {
  const results = [];
  const onPath = new Set([from]);
  const edges = [];

  function dfs(u) {
    if (u === to) {
      results.push(makeRoute(from, edges));
      return;
    }
    if (edges.length === maxLegs) return;

    for (const edge of graph.adj[u]) {
      if (onPath.has(edge.to)) continue;
      onPath.add(edge.to);
      edges.push(edge);
      dfs(edge.to);
      edges.pop();
      onPath.delete(edge.to);
    }
  }

  dfs(from);
  return results;
}

function makeRoute(from, edges) {
  const legs = edges.map(e => e.flight);
  return {
    path: [from].concat(edges.map(e => e.to)),
    legs: legs,
    totalPrice: legs.reduce((sum, f) => sum + f.price, 0),
    totalTime: legs.reduce((sum, f) => sum + f.duration, 0)
  };
}

function sortRoutes(routes, by) {
  const main = by === 'time' ? 'totalTime' : 'totalPrice';
  const second = by === 'time' ? 'totalPrice' : 'totalTime';
  return routes.slice().sort((a, b) =>
    a[main] - b[main] || a[second] - b[second] || a.legs.length - b.legs.length
  );
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findAllPaths, sortRoutes, makeRoute };
}
