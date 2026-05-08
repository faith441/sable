// Example component showing how to use affiliate links
import { useAffiliateLinks } from '../hooks/useAffiliateLinks';

export function AffiliateLinksExample() {
  const { links, loading, error, getByRetailer, getByCategory } = useAffiliateLinks();

  if (loading) {
    return <div>Loading affiliate links...</div>;
  }

  if (error) {
    return <div>Error loading affiliate links: {error.message}</div>;
  }

  // Get Amazon links
  const amazonLinks = getByRetailer('Amazon');

  // Get links by category
  const fashionLinks = getByCategory('Fashion');

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Affiliate Links</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">All Links ({links.length})</h3>
        <ul className="space-y-2">
          {links.map(link => (
            <li key={link.id} className="p-3 border rounded">
              <div className="font-medium">{link.productName || 'Unnamed Product'}</div>
              <div className="text-sm text-gray-600">
                {link.retailer} - {link.category}
              </div>
              <a
                href={link.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Product →
              </a>
              {link.notes && (
                <div className="text-xs text-gray-500 mt-1">Note: {link.notes}</div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Amazon Links ({amazonLinks.length})</h3>
        <ul className="space-y-2">
          {amazonLinks.map(link => (
            <li key={link.id}>
              <a
                href={link.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {link.productName} →
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Fashion Category ({fashionLinks.length})</h3>
        <ul className="space-y-2">
          {fashionLinks.map(link => (
            <li key={link.id}>
              <a
                href={link.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {link.productName} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
