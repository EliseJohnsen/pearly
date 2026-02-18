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
  defaultExpanded = false,
  className = "border-t border-purple",
}: CollapsableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`overflow-hidden m-0 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-gray-50"
      >
        {typeof header === "string" ? (
          <h3 className="text-xl font-medium">{header}</h3>
        ) : (
          header
        )}
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-dark-purple flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-dark-purple flex-shrink-0" />
        )}
      </button>

      {isExpanded && <div className="px-4 pb-6 text-black">{children}</div>}
    </div>
  );
}
