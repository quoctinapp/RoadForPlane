function buildSegments(from, stops, to, dates, roundTrip) {
  const points = [from].concat(stops, [to]);
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({ from: points[i], to: points[i + 1], date: dates[i], kind: 'out' });
  }
  if (roundTrip) {
    segments.push({ from: to, to: from, date: dates[points.length - 1], kind: 'return' });
  }
  return segments;
}

function routeFromLegs(from, legs) {
  return {
    path: [from].concat(legs.map(f => f.to)),
    legs: legs,
    totalPrice: legs.reduce((sum, f) => sum + f.price, 0),
    totalTime: legs.reduce((sum, f) => sum + f.duration, 0)
  };
}

function samePath(a, b) {
  return a.length === b.length && a.every((code, i) => code === b[i]);
}

function solveSegment(cityCodes, flights, segment, mode, incidents, maxLegs) {
  const graph = buildGraph(cityCodes, flights, segment.date, mode, incidents);
  if (segment.from === segment.to) return { graph: graph, result: null, routes: [] };

  const result = dijkstra(graph, segment.from, segment.to);
  const routes = sortRoutes(findAllPaths(graph, segment.from, segment.to, maxLegs), mode);
  if (result.path.length && !routes.some(r => samePath(r.path, result.path))) {
    routes.unshift(routeFromLegs(segment.from, result.legs));
  }
  return { graph: graph, result: result, routes: routes };
}

function reroute(route, legIndex, graph, target) {
  const at = route.path[legIndex];
  const result = dijkstra(graph, at, target);
  if (!result.path.length) return { at: at, result: result, newRoute: null };
  const flown = route.legs.slice(0, legIndex);
  return { at: at, result: result, newRoute: routeFromLegs(route.path[0], flown.concat(result.legs)) };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildSegments, routeFromLegs, samePath, solveSegment, reroute };
}
