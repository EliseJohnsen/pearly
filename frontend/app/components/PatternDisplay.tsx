"use client";
import {useUIString} from '@/app/hooks/useSanityData'

interface PatternDisplayProps {
  pattern: {
    uuid: string;
    pattern_image_url: string;
    grid_size: number;
    colors_used: Array<{
      hex: string;
      name: string;
      count: number;
    }>;
    is_paid: boolean;
    created_at: string;
    boards_width?: number;
    boards_height?: number;
  };
}

export default function PatternDisplay({ pattern }: PatternDisplayProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const imageUrl = `${apiUrl}${pattern.pattern_image_url}`;

  const yourPatternText = useUIString('your_pattern')
  const colorsYouNeedText = useUIString('colors_you_need')

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        { yourPatternText }
      </h2>

      <div className="mb-6">
        <img
          src={imageUrl}
          alt="Pattern"
          className="max-w-full h-auto rounded-lg border-2 border-gray-300"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          { colorsYouNeedText }
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pattern.colors_used.map((color) => (
            <div
              key={color.hex}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {color.name}
                </p>
                <p className="text-sm text-gray-500">
                  {color.count} perler
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-sm text-gray-600">
          Mønster ID: <span className="font-mono">{pattern.uuid}</span>
        </p>
        {pattern.boards_width && pattern.boards_height ? (
          <>
            <p className="text-sm text-gray-600">
              <strong>Brett:</strong> {pattern.boards_width} × {pattern.boards_height} brett ({pattern.boards_width * pattern.boards_height} totalt)
            </p>
            <p className="text-sm text-gray-600">
              <strong>Størrelse:</strong> {pattern.boards_width * 29} × {pattern.boards_height * 29} perler
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Størrelse: {pattern.grid_size}x{pattern.grid_size} perler
          </p>
        )}
      </div>
    </div>
  );
}
