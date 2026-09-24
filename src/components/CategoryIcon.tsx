'use client';
// src/components/CategoryIcon.tsx
import React from 'react';
import {
  ClipboardList,
  PenTool,
  Zap,
  Bot,
  Tag,
  Image,
  FileText,
  Shield,
  Search,
  BarChart3,
  Mic,
  Target,
  ShoppingCart,
  Edit3,
  Brain,
  Music,
  Globe,
  Monitor,
  Layers,
} from 'lucide-react';

interface CategoryIconProps {
  slug?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CategoryIcon({ slug, size = 16, className, style }: CategoryIconProps) {
  switch (slug) {
    case 'surveys':
      return <ClipboardList size={size} className={className} style={style} />;
    case 'survey-creation':
      return <PenTool size={size} className={className} style={style} />;
    case 'prompt-engineering':
      return <Zap size={size} className={className} style={style} />;
    case 'ai-evaluation':
      return <Bot size={size} className={className} style={style} />;
    case 'data-annotation':
      return <Tag size={size} className={className} style={style} />;
    case 'image-classification':
      return <Image size={size} className={className} style={style} />;
    case 'text-classification':
      return <FileText size={size} className={className} style={style} />;
    case 'content-moderation':
      return <Shield size={size} className={className} style={style} />;
    case 'web-research':
      return <Search size={size} className={className} style={style} />;
    case 'data-collection':
      return <BarChart3 size={size} className={className} style={style} />;
    case 'transcription':
      return <Mic size={size} className={className} style={style} />;
    case 'search-relevance':
      return <Target size={size} className={className} style={style} />;
    case 'product-categorization':
      return <ShoppingCart size={size} className={className} style={style} />;
    case 'content-writing':
      return <Edit3 size={size} className={className} style={style} />;
    case 'ai-training':
      return <Brain size={size} className={className} style={style} />;
    case 'audio-evaluation':
      return <Music size={size} className={className} style={style} />;
    case 'translation':
      return <Globe size={size} className={className} style={style} />;
    case 'website-testing':
      return <Monitor size={size} className={className} style={style} />;
    default:
      return <Layers size={size} className={className} style={style} />;
  }
}
