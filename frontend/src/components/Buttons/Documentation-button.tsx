import React from "react";
import { Link } from "@/components/ui";

export const DocumentationButton: React.FC<{
  size?: 'small' | 'default' | 'large';
}> = ({ size }) => (
  <Link color='medium' href='/doc/' size={ size } target='_blank'>Documentation</Link>
)