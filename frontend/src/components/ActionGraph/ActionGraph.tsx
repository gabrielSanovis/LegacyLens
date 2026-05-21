/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './ActionGraph.module.css';

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  filePath?: string;
  loc?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

interface ActionGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Ensure d3's SimulationNodeDatum is mixed in so D3 can modify x, y, vx, vy
type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimEdge = d3.SimulationLinkDatum<SimNode> & GraphEdge;

const getColorForType = (type: string) => {
  switch (type) {
    case 'Saga':
      return '#9333ea'; // Purple
    case 'Action':
      return '#2563eb'; // Blue
    case 'Reducer':
      return '#16a34a'; // Green
    case 'Selector':
      return '#ea580c'; // Orange
    default:
      return '#64748b'; // Gray
  }
};

export function ActionGraph({ nodes, edges }: ActionGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Deep copy for simulation to mutate
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simEdges: SimEdge[] = edges.map((e) => ({ ...e }));

    const g = svg.append('g');

    setupZoom(svg, g, width, height);
    setupArrowDefs(svg);

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3.forceLink<SimNode, SimEdge>(simEdges).id((d) => d.id).distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    const link = renderEdges(g, simEdges);
    const node = renderNodes(g, simNodes, simulation);

    simulation.on('tick', () => {
      link.attr('d', (d) => {
        const src = d.source as SimNode;
        const tgt = d.target as SimNode;
        return `M${src.x},${src.y}A0,0 0 0,1 ${tgt.x},${tgt.y}`;
      });
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  return (
    <div className={styles.wrapper}>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}

function setupZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number
) {
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);
  // Initial zoom out slightly to fit
  svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));
}

function setupArrowDefs(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20) // Shift arrow head slightly before the node center
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#9ca3af');
}

function renderEdges(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  simEdges: SimEdge[]
) {
  return g
    .append('g')
    .selectAll('path')
    .data(simEdges)
    .join('path')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1.5)
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrow)');
}

function renderNodes(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  simNodes: SimNode[],
  simulation: d3.Simulation<SimNode, undefined>
) {
  const node = g
    .append('g')
    .selectAll('g')
    .data(simNodes)
    .join('g')
    .call(drag(simulation) as any);

  node
    .append('circle')
    .attr('r', 15)
    .attr('fill', (d) => getColorForType(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  node
    .append('text')
    .text((d) => d.name)
    .attr('x', 20)
    .attr('y', 4)
    .attr('font-size', '12px')
    .attr('font-family', 'sans-serif')
    .attr('fill', '#374151');

  node.append('title').text((d) => `${d.type}: ${d.name}\nFile: ${d.filePath || '?'}`);

  return node;
}

function drag(simulation: d3.Simulation<SimNode, undefined>) {
  function dragstarted(event: any, d: SimNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event: any, d: SimNode) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event: any, d: SimNode) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  return d3
    .drag<SVGGElement, SimNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}
