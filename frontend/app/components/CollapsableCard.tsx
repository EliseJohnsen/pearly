"use client";

import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface CollapsableCardProps {
  header: string | React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsableCard({
  header,
  children,
  defaultExpanded = true,
  className = "",
}: CollapsableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`overflow-hidden m-0 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer transition-colors"
      >
        {typeof header === "string" ? (
          <h3 className="text-2xl text-gray-900">{header}</h3>
        ) : (
          header
        )}
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
