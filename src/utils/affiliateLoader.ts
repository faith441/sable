// Affiliate Link Loader
// Loads affiliate links from CSV and integrates with shopping API

export interface AffiliateLink {
  id: string;
  retailer: string;
  affiliateLink: string;
  productName: string;
  category: string;
  dateAdded: string;
  notes?: string;
}

export class AffiliateLoader {
  private affiliateLinks: AffiliateLink[] = [];

  /**
   * Load affiliate links from CSV data
   */
  async loadFromCSV(csvData: string): Promise<AffiliateLink[]> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');

    this.affiliateLinks = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        id: values[0],
        retailer: values[1],
        affiliateLink: values[2],
        productName: values[3] || '',
        category: values[4] || '',
        dateAdded: values[5],
        notes: values[6] || undefined
      };
    });

    return this.affiliateLinks;
  }

  /**
   * Load affiliate links from CSV file
   */
  async loadFromFile(filePath: string): Promise<AffiliateLink[]> {
    try {
      const response = await fetch(filePath);
      const csvData = await response.text();
      return this.loadFromCSV(csvData);
    } catch (error) {
      console.error('Error loading affiliate CSV:', error);
      return [];
    }
  }

  /**
   * Get all affiliate links
   */
  getAll(): AffiliateLink[] {
    return this.affiliateLinks;
  }

  /**
   * Get affiliate links by retailer
   */
  getByRetailer(retailer: string): AffiliateLink[] {
    return this.affiliateLinks.filter(link =>
      link.retailer.toLowerCase() === retailer.toLowerCase()
    );
  }

  /**
   * Get affiliate links by category
   */
  getByCategory(category: string): AffiliateLink[] {
    return this.affiliateLinks.filter(link =>
      link.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get affiliate link by ID
   */
  getById(id: string): AffiliateLink | undefined {
    return this.affiliateLinks.find(link => link.id === id);
  }

  /**
   * Convert product URL to affiliate URL if available
   */
  convertToAffiliateUrl(productUrl: string, retailer: string): string {
    const affiliateLinks = this.getByRetailer(retailer);

    // For Amazon, you might want to inject your affiliate tag
    if (retailer.toLowerCase() === 'amazon' && affiliateLinks.length > 0) {
      // Use the first Amazon affiliate link as a template
      const affiliateLink = affiliateLinks[0];
      // Extract affiliate tag from the link (this is simplified)
      // Real implementation would parse Amazon URLs properly
      return productUrl; // Return as-is for now
    }

    return productUrl;
  }
}

// Export singleton instance
export const affiliateLoader = new AffiliateLoader();
