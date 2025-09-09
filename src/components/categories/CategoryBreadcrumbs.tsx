'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

interface CategoryBreadcrumbsProps {
  categoryId: string;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}

export function CategoryBreadcrumbs({ 
  categoryId, 
  showHome = true, 
  homeHref = '/',
  className = ''
}: CategoryBreadcrumbsProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadBreadcrumbs();
    }
  }, [categoryId]);

  const loadBreadcrumbs = async () => {
    try {
      const response = await fetch(`/api/categories/breadcrumbs/${categoryId}`);
      const data = await response.json();
      
      if (response.ok) {
        setBreadcrumbs(data.breadcrumbs || []);
      } else {
        console.error('Error loading breadcrumbs:', data.error);
      }
    } catch (error) {
      console.error('Error loading breadcrumbs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {showHome && (
        <>
          <Link 
            href={homeHref}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      )}

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">
              {item.name}
            </span>
          ) : (
            <Link
              href={`/categories/${item.slug}`}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
