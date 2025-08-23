import React from 'react';
import { Link } from 'react-router-dom';

// A reusable component for each employee card in the chart
const EmployeeCard = ({ employee }) => (
  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 min-w-[160px]">
    <img
      src={`https://placehold.co/64x64/E2E8F0/4A5568?text=${employee.name.charAt(0)}`}
      alt={employee.name}
      className="w-16 h-16 rounded-full mb-2"
    />
    <Link to={`/people/${employee.id}`} className="font-bold text-gray-800 text-center hover:text-blue-600">{employee.name}</Link>
    <p className="text-xs text-gray-500 text-center">{employee.position}</p>
  </div>
);

// A recursive component to render a manager and their direct reports
const TreeNode = ({ node }) => {
    return (
        <div className="flex flex-col items-center">
            <EmployeeCard employee={node} />
            {node.children && node.children.length > 0 && (
                <>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex justify-center relative">
                        <div className="absolute top-0 h-px w-full bg-gray-300"></div>
                        {node.children.map(child => (
                            <div key={child.id} className="px-4 relative">
                                <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

function OrgChart({ employees }) {
  // --- NEW: A much more robust, two-pass algorithm for building the tree ---
  const buildTree = () => {
    const nodes = {};
    // First pass: create a node for each employee and index it by its own ID.
    employees.forEach(emp => {
      nodes[emp.id] = { ...emp, children: [] };
    });

    const tree = [];
    // Second pass: iterate through all created nodes to link them.
    Object.values(nodes).forEach(node => {
      // Find the manager for the current node.
      const manager = employees.find(m => m.email === node.managerEmail);
      
      if (manager && manager.id !== node.id && nodes[manager.id]) {
        // If a manager exists in our map, add the current node as a child.
        nodes[manager.id].children.push(node);
      } else {
        // If no manager is found, this is a top-level employee (a "root").
        tree.push(node);
      }
    });

    return tree;
  };

  const tree = buildTree();

  if (employees.length === 0) {
    return <div className="text-center text-gray-500 p-8">No employees to display in the chart.</div>;
  }
  
  if (tree.length === 0 && employees.length > 0) {
    return <div className="text-center text-gray-500 p-8">Could not determine a top-level manager. Please check your data for circular reporting structures.</div>;
  }

  return (
    <div className="p-8 bg-gray-50 rounded-b-lg overflow-x-auto">
      <div className="flex justify-center items-start gap-8">
        {tree.map(rootNode => (
          <TreeNode key={rootNode.id} node={rootNode} />
        ))}
      </div>
    </div>
  );
}

export default OrgChart;