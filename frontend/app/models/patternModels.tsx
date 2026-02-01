export interface Pattern {
  id: string;
  uuid: string;
  pattern_image_url: string;
  grid_size: number;
  colors_used: Array<{
    hex: string;
    name: string;
    count: number;
    code?: string;
  }>;
  created_at: string;
  boards_width?: number;
  boards_height?: number;
  pattern_data?: {
    grid: string[][];
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
    hex: string;
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
      hex: string;
      name: string;
      count: number;
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
      hex: string;
      name: string;
      count: number;
    }>;
  };
  customerEmail?: string;
}