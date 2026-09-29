import xml.etree.ElementTree as ET

handles = ['seecontainer-20','20-seecontainer-high-cube','20-seecontainer-anthrazitgrau','20-seecontainer-3','containeranlage-8x20','containeranlage-23x206x161x10','containeranlage-12x202x24','9x-buerocontainer-20','24-containeranlage-classic-line','14x-container-24']

tree = ET.parse('wp-sitemap-posts-product-1.xml')
root = tree.getroot()
urls = [loc.text for loc in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]

for h in handles:
    matches = [u for u in urls if h in u]
    print(h, '->', matches[0] if matches else 'NOT FOUND')
