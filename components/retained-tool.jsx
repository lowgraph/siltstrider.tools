"use client";
import {useState} from 'react';

// Mount a tool on its first visit, then let the shell hide its panel without
// discarding recipes, draft effects, manual plans, or search filters.
export default function RetainedTool({active,children}) {
 const [visited,setVisited]=useState(active);
 if (active && !visited) setVisited(true);
 return active || visited ? children : null;
}
