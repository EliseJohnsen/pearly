"use client";

import { PortableText } from "next-sanity";
import CollapsableCard from "./CollapsableCard";
import * as HeroIcons from "@heroicons/react/24/outline";
import { portableTextComponents } from "./PortableTextComponents";

interface CollapsableCardsSectionProps {
  data: {
    sectionTitle: string;
    cards: Array<{
      header: string;
      icon: string;
      content: any; // Portable Text blocks
      defaultExpanded?: boolean;
      order: number;
    }>;
    isActive?: boolean;
  };
}

// Helper function to get icon component from Heroicons
function getIconComponent(iconName: string) {
  // @ts-ignore - Dynamic icon access
  const IconComponent = HeroIcons[iconName];

  if (!IconComponent) {
    // Fallback to QuestionMarkCircleIcon if icon not found
    return HeroIcons.QuestionMarkCircleIcon;
  }

  return IconComponent;
}

export default function CollapsableCardsSection({
  data,
}: CollapsableCardsSectionProps) {
  if (data.isActive === false) return null;

  // Sort cards by order
  const sortedCards = [...data.cards].sort((a, b) => a.order - b.order);

  return (
    <section className="container mx-auto px-4 py-10 md:py-16">
      {/* Section Title */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-dark-purple">
          {data.sectionTitle}
        </h2>
      </div>

      {/* Collapsable Cards */}
      <div className="max-w-3xl mx-auto">
        {sortedCards.map((card, index) => {
          const IconComponent = getIconComponent(card.icon);
          const isLast = index === sortedCards.length - 1;

          // Apply border styling based on position
          // All items get top border, last item also gets bottom border
          const borderClass = isLast ? "border-y border-purple" : "border-t border-purple";

          return (
            <CollapsableCard
              key={index}
              header={
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-dark-purple" />
                  </div>
                  <h3 className="text-xl font-medium">
                    {card.header}
                  </h3>
                </div>
              }
              defaultExpanded={card.defaultExpanded}
              className={borderClass}
            >
              <div className="prose prose-sm md:prose-base max-w-none">
                <PortableText
                  value={card.content}
                  components={portableTextComponents}
                />
              </div>
            </CollapsableCard>
          );
        })}
      </div>
    </section>
  );
}
