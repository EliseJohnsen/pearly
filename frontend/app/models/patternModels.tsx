export interface Pattern {
  id: string;
  uuid: string;
  pattern_image_url: string;
  grid_size: number;
  colors_used: Array<{
    hex?: string;  // Optional - can be looked up from code
    name: string;
    count: number;
    code?: string;
  }>;
  created_at: string;
  boards_width?: number;
  boards_height?: number;
  pattern_data?: {
    grid: string[][];  // Color codes (v2) or hex codes (v1)
    grid_hex?: string[][];  // Legacy hex grid (for transition)
    storage_version?: number;  // 1 (hex) or 2 (codes)
    custom_colors?: Record<string, string>;  // Fallback colors map
    width: number;
    height: number;
    boards_width?: number;
    boards_height?: number;
    board_size?: number;
    ai_generated?: boolean;
    ai_prompt?: string;
    ai_style?: string;
    ai_model?: string;
    styled?: boolean;
    style?: string;
    styled_image_path?: string;
  };
}

export interface PatternData {
    id: string;
    uuid: string;
    pattern_image_url: string;
    grid_size: number;
    colors_used: Array<{
    hex?: string;  // Optional - can be looked up from code
    name: string;
    count: number;
    code?: string;
    }>;
    created_at: string;
    boards_width?: number;
    boards_height?: number;
    pattern_data?: any;
    pattern_image_base64?: string;
    styled_image_base64?: string;
}

export interface PatternDisplayProps {
  pattern: {
    id: string;
    uuid: string;
    pattern_image_url: string;
    grid_size: number;
    colors_used: Array<{
      hex?: string;  // Optional - can be looked up from code
      name: string;
      count: number;
      code?: string;
    }>;
    created_at: string;
    boards_width?: number;
    boards_height?: number;
  };
}

export interface PatternPDFProps {
  patternImageUrl: string;
  patternData: {
    gridSize: number;
    boards_width?: number;
    boards_height?: number;
    colors_used?: Array<{
      hex?: string;  // Optional - can be looked up from code
      name: string;
      count: number;
      code?: string;
    }>;
  };
  customerEmail?: string;
}