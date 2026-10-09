import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import glyphMapJson from './ionicons-glyphmap.json';

// Drop-in replacement for @expo/vector-icons' Ionicons: renders the glyph from
// the vendored Ionicons font (public/fonts/Ionicons.ttf, @font-face in
// index.html). Same API: name / size / color, plus a static glyphMap so
// `keyof typeof Ionicons.glyphMap` keeps typing icon names.
const glyphMap = glyphMapJson as Record<keyof typeof glyphMapJson, number>;

export type IoniconName = keyof typeof glyphMapJson;

export interface IoniconsProps extends TextProps {
  name: IoniconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function getGlyph(name: string): string {
  const code = (glyphMap as Record<string, number>)[name];
  return code === undefined ? '?' : String.fromCodePoint(code);
}

const FONT_OVERRIDES: TextStyle = {
  fontFamily: 'Ionicons',
  fontWeight: 'normal',
  fontStyle: 'normal',
};

function IoniconsBase({ name, size = 12, color, style, ...props }: IoniconsProps) {
  return (
    <Text
      selectable={false}
      {...props}
      // Same order as react-native-vector-icons: caller style can override
      // size/color but never the icon font itself.
      style={[{ fontSize: size, color }, style, FONT_OVERRIDES]}
    >
      {getGlyph(name)}
    </Text>
  );
}

export const Ionicons = Object.assign(IoniconsBase, { glyphMap });

export default Ionicons;
