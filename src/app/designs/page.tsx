'use client';

import React, { useState, useEffect } from 'react';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignCatalog } from '@/components/designs/DesignCatalog';
import { DesignGrid } from '@/components/designs/DesignGrid';
import { Button } from '@/components/ui/Button';
import { 
  Star, 
  Download, 
  Heart, 
  TrendingUp,
  Sparkles,
  Palette
} from 'lucide-react';

export default function DesignsPage() {
  const [featuredDesigns, setFeaturedDesigns] = useState<DesignWithDetails[]>([]);
  const [popularDesigns, setPopularDesigns] = useState<DesignWithDetails[]>([]);
  const [freeDesigns, setFreeDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setLoading(true);

      // Load featured designs
      const featuredResponse = await fetch('/api/designs/featured?limit=8');
      const featuredData = await featuredResponse.json();
      setFeaturedDesigns(featuredData.designs || []);

      // Load popular designs
      const popularResponse = await fetch('/api/designs/popular?limit=8');
      const popularData = await popularResponse.json();
      setPopularDesigns(popularData.designs || []);

      // Load free designs
      const freeResponse = await fetch('/api/designs/free?limit=8');
      const freeData = await freeResponse.json();
      setFreeDesigns(freeData.designs || []);

    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Designs
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Explore a world of creative designs from talented artists and designers
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 border-0">
                <Palette className="w-5 h-5 mr-2" />
                Browse All Designs
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Sparkles className="w-5 h-5 mr-2" />
                Upload Your Design
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Designs */}
      {featuredDesigns.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Designs
              </h2>
              <p className="text-lg text-gray-600">
                Handpicked designs that showcase exceptional creativity
              </p>
            </div>
            <DesignGrid
              designs={featuredDesigns}
              columns={4}
              variant="catalog"
            />
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All Featured
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Popular Designs */}
      {popularDesigns.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Most Popular
              </h2>
              <p className="text-lg text-gray-600">
                Designs that are trending and loved by the community
              </p>
            </div>
            <DesignGrid
              designs={popularDesigns}
              columns={4}
              variant="catalog"
            />
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All Popular
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Free Designs */}
      {freeDesigns.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Free Designs
              </h2>
              <p className="text-lg text-gray-600">
                High-quality designs available for free download
              </p>
            </div>
            <DesignGrid
              designs={freeDesigns}
              columns={4}
              variant="catalog"
            />
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All Free Designs
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Design Catalog */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DesignCatalog
            title="Browse All Designs"
            subtitle="Discover designs from every category and style"
            showFilters={true}
            showSearch={true}
            showSorting={true}
            showViewToggle={true}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Share Your Designs?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join our community of talented designers and showcase your creative work
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" variant="secondary">
              <Palette className="w-5 h-5 mr-2" />
              Start Designing
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
