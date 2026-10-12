-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA MODEL REGISTRY - COMMON BUSINESS TABLES (USER-FRIENDLY)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: General business tables for all industries with easy-to-understand names
-- Industries: Retail, Medical, Restaurant, Software, Education, Social Media, etc.
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Optional: Clear existing data
-- DELETE FROM data_model_registry WHERE module IN ('CORE', 'CUSTOMERS', 'PRODUCTS', 'ORDERS', 'INVENTORY', 'EMPLOYEES', 'FINANCE', 'SERVICES', 'SOCIAL');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CORE MODULE - Business/Company Profile
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('CORE', 'business', 'business_id', 'UUID', 'Business ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique business identifier', 1, false, true, true, false, false, false, true, true, 'business_profile'),
('CORE', 'business', 'business_name', 'VARCHAR(255)', 'Business Name', 'Business Name', 'text_input', 'text', 'basic_info', 'Name of the business', 2, false, false, true, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'business_type', 'VARCHAR(100)', 'Business Type', 'Type', 'dropdown', 'select', 'classification', 'Store/Medical/Restaurant/Software/School etc.', 3, false, false, true, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'industry', 'VARCHAR(100)', 'Industry', 'Industry', 'dropdown', 'select', 'classification', 'Industry category', 4, true, false, false, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'owner_name', 'VARCHAR(255)', 'Owner Name', 'Owner', 'text_input', 'text', 'basic_info', 'Business owner name', 5, true, false, false, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'email', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Business email', 6, true, false, false, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'phone', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Contact phone', 7, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'address', 'TEXT', 'Address', 'Address', 'textarea', 'textarea', 'location', 'Full address', 8, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'city', 'VARCHAR(100)', 'City', 'City', 'text_input', 'text', 'location', 'City name', 9, true, false, false, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'state', 'VARCHAR(100)', 'State', 'State', 'text_input', 'text', 'location', 'State/Province', 10, true, false, false, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'country', 'VARCHAR(100)', 'Country', 'Country', 'dropdown', 'select', 'location', 'Country', 11, false, false, true, true, true, true, true, false, 'business_profile'),
('CORE', 'business', 'postal_code', 'VARCHAR(20)', 'Postal Code', 'ZIP', 'text_input', 'text', 'location', 'ZIP/Postal code', 12, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'website', 'VARCHAR(255)', 'Website', 'Website', 'url_input', 'url', 'online', 'Business website', 13, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'logo', 'TEXT', 'Logo', 'Logo', 'image_upload', 'file', 'branding', 'Business logo', 14, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'established_date', 'DATE', 'Established Date', 'Est. Date', 'date_picker', 'date', 'timeline', 'Business start date', 15, true, false, false, true, false, true, true, false, 'business_profile'),
('CORE', 'business', 'registration_number', 'VARCHAR(100)', 'Registration Number', 'Reg. No.', 'text_input', 'text', 'legal', 'Business registration', 16, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'tax_id', 'VARCHAR(50)', 'Tax ID', 'Tax ID', 'text_input', 'text', 'legal', 'Tax identification', 17, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Business currency', 18, false, false, true, true, true, false, true, false, 'business_profile'),
('CORE', 'business', 'timezone', 'VARCHAR(50)', 'Timezone', 'Timezone', 'dropdown', 'select', 'settings', 'Business timezone', 19, true, false, false, true, false, false, true, false, 'business_profile'),
('CORE', 'business', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 20, false, false, true, true, true, true, true, false, 'business_profile');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CUSTOMERS MODULE - Customer/Client Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('CUSTOMERS', 'customers', 'customer_id', 'UUID', 'Customer ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique customer ID', 1, false, true, true, false, false, false, true, true, 'customer_master'),
('CUSTOMERS', 'customers', 'customer_number', 'VARCHAR(20)', 'Customer Number', 'Customer #', 'text_input', 'text', 'identification', 'Customer reference number', 2, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'customer_type', 'VARCHAR(50)', 'Customer Type', 'Type', 'dropdown', 'select', 'classification', 'Individual/Business/Member', 3, false, false, true, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'first_name', 'VARCHAR(100)', 'First Name', 'First Name', 'text_input', 'text', 'basic_info', 'Customer first name', 4, false, false, true, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'last_name', 'VARCHAR(100)', 'Last Name', 'Last Name', 'text_input', 'text', 'basic_info', 'Customer last name', 5, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'company_name', 'VARCHAR(255)', 'Company Name', 'Company', 'text_input', 'text', 'basic_info', 'Company name (if business)', 6, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'email', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Email address', 7, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'phone', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Phone number', 8, true, false, false, true, true, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'alternate_phone', 'VARCHAR(20)', 'Alternate Phone', 'Alt. Phone', 'phone_input', 'tel', 'contact', 'Secondary phone', 9, true, false, false, true, false, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'address', 'TEXT', 'Address', 'Address', 'textarea', 'textarea', 'location', 'Street address', 10, true, false, false, true, false, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'city', 'VARCHAR(100)', 'City', 'City', 'text_input', 'text', 'location', 'City', 11, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'state', 'VARCHAR(100)', 'State', 'State', 'text_input', 'text', 'location', 'State/Province', 12, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'postal_code', 'VARCHAR(20)', 'Postal Code', 'ZIP', 'text_input', 'text', 'location', 'Postal code', 13, true, false, false, true, false, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'country', 'VARCHAR(100)', 'Country', 'Country', 'dropdown', 'select', 'location', 'Country', 14, true, false, false, true, true, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'date_of_birth', 'DATE', 'Date of Birth', 'DOB', 'date_picker', 'date', 'personal', 'Date of birth', 15, true, false, false, true, false, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'gender', 'VARCHAR(20)', 'Gender', 'Gender', 'dropdown', 'select', 'personal', 'Gender', 16, true, false, false, true, true, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'notes', 'TEXT', 'Notes', 'Notes', 'textarea', 'textarea', 'additional', 'Customer notes', 17, true, false, false, true, false, false, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'customer_since', 'DATE', 'Customer Since', 'Since', 'date_picker', 'date', 'timeline', 'First purchase date', 18, true, false, false, true, false, true, true, false, 'customer_master'),
('CUSTOMERS', 'customers', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 19, false, false, true, true, true, true, true, false, 'customer_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PRODUCTS MODULE - Product/Service Catalog
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('PRODUCTS', 'products', 'product_id', 'UUID', 'Product ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique product ID', 1, false, true, true, false, false, false, true, true, 'product_master'),
('PRODUCTS', 'products', 'product_code', 'VARCHAR(50)', 'Product Code', 'Code', 'text_input', 'text', 'identification', 'SKU/Product code', 2, true, false, false, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'product_name', 'VARCHAR(255)', 'Product Name', 'Name', 'text_input', 'text', 'basic_info', 'Product name', 3, false, false, true, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'basic_info', 'Product description', 4, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'category', 'VARCHAR(100)', 'Category', 'Category', 'dropdown', 'select', 'classification', 'Product category', 5, true, false, false, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'subcategory', 'VARCHAR(100)', 'Subcategory', 'Subcategory', 'dropdown', 'select', 'classification', 'Product subcategory', 6, true, false, false, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'brand', 'VARCHAR(100)', 'Brand', 'Brand', 'text_input', 'text', 'classification', 'Brand name', 7, true, false, false, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'unit_price', 'DECIMAL(15,2)', 'Unit Price', 'Price', 'number_input', 'number', 'pricing', 'Selling price', 8, false, false, true, true, false, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'cost_price', 'DECIMAL(15,2)', 'Cost Price', 'Cost', 'number_input', 'number', 'pricing', 'Purchase cost', 9, true, false, false, true, false, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'pricing', 'Price currency', 10, false, false, true, true, true, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'unit_of_measure', 'VARCHAR(20)', 'Unit of Measure', 'UOM', 'dropdown', 'select', 'measurement', 'Piece/Kg/Liter/Hour etc.', 11, false, false, true, true, true, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'weight', 'DECIMAL(10,3)', 'Weight', 'Weight', 'number_input', 'number', 'physical', 'Product weight', 12, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'weight_unit', 'VARCHAR(10)', 'Weight Unit', 'Wt Unit', 'dropdown', 'select', 'physical', 'Kg/g/lb', 13, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'barcode', 'VARCHAR(50)', 'Barcode', 'Barcode', 'text_input', 'text', 'identification', 'Barcode number', 14, true, false, false, true, true, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'image', 'TEXT', 'Product Image', 'Image', 'image_upload', 'file', 'media', 'Product photo', 15, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'stock_quantity', 'INTEGER', 'Stock Quantity', 'Stock', 'number_input', 'number', 'inventory', 'Available stock', 16, true, false, false, true, false, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'reorder_level', 'INTEGER', 'Reorder Level', 'Reorder', 'number_input', 'number', 'inventory', 'Minimum stock level', 17, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'tax_rate', 'DECIMAL(5,2)', 'Tax Rate', 'Tax %', 'number_input', 'number', 'tax', 'Tax percentage', 18, true, false, false, true, false, false, true, false, 'product_master'),
('PRODUCTS', 'products', 'is_active', 'BOOLEAN', 'Active', 'Active', 'toggle', 'checkbox', 'status', 'Product active status', 19, false, false, true, true, true, true, true, false, 'product_master'),
('PRODUCTS', 'products', 'is_featured', 'BOOLEAN', 'Featured', 'Featured', 'toggle', 'checkbox', 'marketing', 'Featured product', 20, true, false, false, true, true, false, true, false, 'product_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SERVICES MODULE - Service Catalog (for service-based businesses)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('SERVICES', 'services', 'service_id', 'UUID', 'Service ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique service ID', 1, false, true, true, false, false, false, true, true, 'service_master'),
('SERVICES', 'services', 'service_code', 'VARCHAR(50)', 'Service Code', 'Code', 'text_input', 'text', 'identification', 'Service code', 2, true, false, false, true, true, true, true, false, 'service_master'),
('SERVICES', 'services', 'service_name', 'VARCHAR(255)', 'Service Name', 'Name', 'text_input', 'text', 'basic_info', 'Service name', 3, false, false, true, true, true, true, true, false, 'service_master'),
('SERVICES', 'services', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'basic_info', 'Service description', 4, true, false, false, true, false, false, true, false, 'service_master'),
('SERVICES', 'services', 'category', 'VARCHAR(100)', 'Category', 'Category', 'dropdown', 'select', 'classification', 'Service category', 5, true, false, false, true, true, true, true, false, 'service_master'),
('SERVICES', 'services', 'duration', 'INTEGER', 'Duration (minutes)', 'Duration', 'number_input', 'number', 'timing', 'Service duration', 6, true, false, false, true, false, false, true, false, 'service_master'),
('SERVICES', 'services', 'price', 'DECIMAL(15,2)', 'Price', 'Price', 'number_input', 'number', 'pricing', 'Service price', 7, false, false, true, true, false, true, true, false, 'service_master'),
('SERVICES', 'services', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'pricing', 'Price currency', 8, false, false, true, true, true, false, true, false, 'service_master'),
('SERVICES', 'services', 'tax_rate', 'DECIMAL(5,2)', 'Tax Rate', 'Tax %', 'number_input', 'number', 'tax', 'Tax percentage', 9, true, false, false, true, false, false, true, false, 'service_master'),
('SERVICES', 'services', 'is_bookable', 'BOOLEAN', 'Bookable Online', 'Bookable', 'toggle', 'checkbox', 'booking', 'Allow online booking', 10, true, false, false, true, true, false, true, false, 'service_master'),
('SERVICES', 'services', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 11, false, false, true, true, true, true, true, false, 'service_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. ORDERS MODULE - Sales Orders/Transactions
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('ORDERS', 'orders', 'order_id', 'UUID', 'Order ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique order ID', 1, false, true, true, false, false, false, true, true, 'order_master'),
('ORDERS', 'orders', 'order_number', 'VARCHAR(50)', 'Order Number', 'Order #', 'text_input', 'text', 'identification', 'Order reference number', 2, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'order_date', 'TIMESTAMP', 'Order Date', 'Date', 'datetime', 'datetime', 'timeline', 'Order date & time', 3, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'customer_id', 'UUID', 'Customer', 'Customer', 'dropdown', 'select', 'customer', 'Customer reference', 4, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'order_type', 'VARCHAR(50)', 'Order Type', 'Type', 'dropdown', 'select', 'classification', 'Sales/Purchase/Service', 5, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'payment_method', 'VARCHAR(50)', 'Payment Method', 'Payment', 'dropdown', 'select', 'payment', 'Cash/Card/UPI/Online', 6, true, false, false, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'payment_status', 'VARCHAR(50)', 'Payment Status', 'Pay Status', 'dropdown', 'select', 'payment', 'Paid/Pending/Partial', 7, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'order_status', 'VARCHAR(50)', 'Order Status', 'Status', 'dropdown', 'select', 'status', 'Pending/Processing/Completed/Cancelled', 8, false, false, true, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'subtotal', 'DECIMAL(15,2)', 'Subtotal', 'Subtotal', 'number_input', 'number', 'amounts', 'Total before tax', 9, false, false, true, true, false, true, true, false, 'order_master'),
('ORDERS', 'orders', 'tax_amount', 'DECIMAL(15,2)', 'Tax Amount', 'Tax', 'number_input', 'number', 'amounts', 'Total tax', 10, true, false, false, true, false, true, true, false, 'order_master'),
('ORDERS', 'orders', 'discount_amount', 'DECIMAL(15,2)', 'Discount', 'Discount', 'number_input', 'number', 'amounts', 'Total discount', 11, true, false, false, true, false, true, true, false, 'order_master'),
('ORDERS', 'orders', 'shipping_amount', 'DECIMAL(15,2)', 'Shipping', 'Shipping', 'number_input', 'number', 'amounts', 'Shipping charges', 12, true, false, false, true, false, true, true, false, 'order_master'),
('ORDERS', 'orders', 'total_amount', 'DECIMAL(15,2)', 'Total Amount', 'Total', 'number_input', 'number', 'amounts', 'Final total', 13, false, false, true, true, false, true, true, false, 'order_master'),
('ORDERS', 'orders', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'amounts', 'Order currency', 14, false, false, true, true, true, false, true, false, 'order_master'),
('ORDERS', 'orders', 'delivery_address', 'TEXT', 'Delivery Address', 'Address', 'textarea', 'textarea', 'delivery', 'Delivery address', 15, true, false, false, true, false, false, true, false, 'order_master'),
('ORDERS', 'orders', 'delivery_date', 'DATE', 'Delivery Date', 'Delivery', 'date_picker', 'date', 'delivery', 'Expected delivery', 16, true, false, false, true, true, true, true, false, 'order_master'),
('ORDERS', 'orders', 'notes', 'TEXT', 'Notes', 'Notes', 'textarea', 'textarea', 'additional', 'Order notes', 17, true, false, false, true, false, false, true, false, 'order_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. INVENTORY MODULE - Stock Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('INVENTORY', 'inventory', 'inventory_id', 'UUID', 'Inventory ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique inventory ID', 1, false, true, true, false, false, false, true, true, 'inventory_master'),
('INVENTORY', 'inventory', 'product_id', 'UUID', 'Product', 'Product', 'dropdown', 'select', 'product', 'Product reference', 2, false, false, true, true, true, true, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'warehouse', 'VARCHAR(100)', 'Warehouse', 'Warehouse', 'dropdown', 'select', 'location', 'Storage location', 3, true, false, false, true, true, true, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'quantity_available', 'INTEGER', 'Available Quantity', 'Available', 'number_input', 'number', 'stock', 'Stock available', 4, false, false, true, true, false, true, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'quantity_reserved', 'INTEGER', 'Reserved Quantity', 'Reserved', 'number_input', 'number', 'stock', 'Stock reserved', 5, true, false, false, true, false, true, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'quantity_damaged', 'INTEGER', 'Damaged Quantity', 'Damaged', 'number_input', 'number', 'stock', 'Damaged stock', 6, true, false, false, true, false, true, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'minimum_stock', 'INTEGER', 'Minimum Stock', 'Min Stock', 'number_input', 'number', 'alerts', 'Minimum level alert', 7, true, false, false, true, false, false, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'maximum_stock', 'INTEGER', 'Maximum Stock', 'Max Stock', 'number_input', 'number', 'alerts', 'Maximum stock level', 8, true, false, false, true, false, false, true, false, 'inventory_master'),
('INVENTORY', 'inventory', 'last_restocked_date', 'DATE', 'Last Restocked', 'Last Restock', 'date_picker', 'date', 'timeline', 'Last restock date', 9, true, false, false, true, false, true, true, false, 'inventory_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. EMPLOYEES MODULE - Staff/Team Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('EMPLOYEES', 'employees', 'employee_id', 'UUID', 'Employee ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique employee ID', 1, false, true, true, false, false, false, true, true, 'employee_master'),
('EMPLOYEES', 'employees', 'employee_number', 'VARCHAR(50)', 'Employee Number', 'Emp #', 'text_input', 'text', 'identification', 'Employee number', 2, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'first_name', 'VARCHAR(100)', 'First Name', 'First Name', 'text_input', 'text', 'basic_info', 'First name', 3, false, false, true, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'last_name', 'VARCHAR(100)', 'Last Name', 'Last Name', 'text_input', 'text', 'basic_info', 'Last name', 4, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'email', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Work email', 5, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'phone', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Contact phone', 6, true, false, false, true, false, false, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'department', 'VARCHAR(100)', 'Department', 'Department', 'dropdown', 'select', 'organization', 'Department name', 7, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'designation', 'VARCHAR(100)', 'Designation', 'Position', 'text_input', 'text', 'organization', 'Job title', 8, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'joining_date', 'DATE', 'Joining Date', 'Join Date', 'date_picker', 'date', 'timeline', 'Date of joining', 9, true, false, false, true, false, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'date_of_birth', 'DATE', 'Date of Birth', 'DOB', 'date_picker', 'date', 'personal', 'Date of birth', 10, true, false, false, true, false, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'gender', 'VARCHAR(20)', 'Gender', 'Gender', 'dropdown', 'select', 'personal', 'Gender', 11, true, false, false, true, true, false, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'address', 'TEXT', 'Address', 'Address', 'textarea', 'textarea', 'location', 'Home address', 12, true, false, false, true, false, false, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'salary', 'DECIMAL(15,2)', 'Salary', 'Salary', 'number_input', 'number', 'compensation', 'Monthly salary', 13, true, false, false, true, false, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'employment_type', 'VARCHAR(50)', 'Employment Type', 'Type', 'dropdown', 'select', 'employment', 'Full-time/Part-time/Contract', 14, true, false, false, true, true, true, true, false, 'employee_master'),
('EMPLOYEES', 'employees', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 15, false, false, true, true, true, true, true, false, 'employee_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. FINANCE MODULE - Invoices & Payments
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('FINANCE', 'invoices', 'invoice_id', 'UUID', 'Invoice ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique invoice ID', 1, false, true, true, false, false, false, true, true, 'invoice_master'),
('FINANCE', 'invoices', 'invoice_number', 'VARCHAR(50)', 'Invoice Number', 'Invoice #', 'text_input', 'text', 'identification', 'Invoice number', 2, false, false, true, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'invoice_date', 'DATE', 'Invoice Date', 'Date', 'date_picker', 'date', 'timeline', 'Invoice date', 3, false, false, true, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'due_date', 'DATE', 'Due Date', 'Due Date', 'date_picker', 'date', 'timeline', 'Payment due date', 4, true, false, false, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'customer_id', 'UUID', 'Customer', 'Customer', 'dropdown', 'select', 'customer', 'Customer reference', 5, false, false, true, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'invoice_type', 'VARCHAR(50)', 'Invoice Type', 'Type', 'dropdown', 'select', 'classification', 'Sales/Purchase/Service', 6, false, false, true, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'subtotal', 'DECIMAL(15,2)', 'Subtotal', 'Subtotal', 'number_input', 'number', 'amounts', 'Amount before tax', 7, false, false, true, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'tax_amount', 'DECIMAL(15,2)', 'Tax Amount', 'Tax', 'number_input', 'number', 'amounts', 'Tax amount', 8, true, false, false, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'discount_amount', 'DECIMAL(15,2)', 'Discount', 'Discount', 'number_input', 'number', 'amounts', 'Discount amount', 9, true, false, false, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'total_amount', 'DECIMAL(15,2)', 'Total Amount', 'Total', 'number_input', 'number', 'amounts', 'Final amount', 10, false, false, true, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'paid_amount', 'DECIMAL(15,2)', 'Paid Amount', 'Paid', 'number_input', 'number', 'payment', 'Amount paid', 11, true, false, false, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'balance_due', 'DECIMAL(15,2)', 'Balance Due', 'Balance', 'number_input', 'number', 'payment', 'Remaining balance', 12, true, false, false, true, false, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'payment_status', 'VARCHAR(50)', 'Payment Status', 'Status', 'dropdown', 'select', 'payment', 'Paid/Pending/Overdue', 13, false, false, true, true, true, true, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'amounts', 'Invoice currency', 14, false, false, true, true, true, false, true, false, 'invoice_master'),
('FINANCE', 'invoices', 'notes', 'TEXT', 'Notes', 'Notes', 'textarea', 'textarea', 'additional', 'Invoice notes', 15, true, false, false, true, false, false, true, false, 'invoice_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. APPOINTMENTS MODULE - Booking/Scheduling (Medical, Salon, Coaching, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('APPOINTMENTS', 'appointments', 'appointment_id', 'UUID', 'Appointment ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique appointment ID', 1, false, true, true, false, false, false, true, true, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'appointment_number', 'VARCHAR(50)', 'Appointment Number', 'Appt #', 'text_input', 'text', 'identification', 'Reference number', 2, true, false, false, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'customer_id', 'UUID', 'Customer', 'Customer', 'dropdown', 'select', 'customer', 'Customer/Patient/Client', 3, false, false, true, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'service_id', 'UUID', 'Service', 'Service', 'dropdown', 'select', 'service', 'Service booked', 4, false, false, true, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'employee_id', 'UUID', 'Staff', 'Staff/Doctor/Teacher', 'dropdown', 'select', 'staff', 'Assigned staff', 5, true, false, false, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'appointment_date', 'DATE', 'Date', 'Date', 'date_picker', 'date', 'schedule', 'Appointment date', 6, false, false, true, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'appointment_time', 'TIME', 'Time', 'Time', 'time_picker', 'time', 'schedule', 'Appointment time', 7, false, false, true, true, false, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'duration', 'INTEGER', 'Duration (min)', 'Duration', 'number_input', 'number', 'schedule', 'Duration in minutes', 8, true, false, false, true, false, false, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'status', 'VARCHAR(50)', 'Status', 'Status', 'dropdown', 'select', 'status', 'Scheduled/Confirmed/Completed/Cancelled', 9, false, false, true, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'payment_status', 'VARCHAR(50)', 'Payment Status', 'Payment', 'dropdown', 'select', 'payment', 'Paid/Pending', 10, true, false, false, true, true, true, true, false, 'appointment_master'),
('APPOINTMENTS', 'appointments', 'notes', 'TEXT', 'Notes', 'Notes', 'textarea', 'textarea', 'additional', 'Appointment notes', 11, true, false, false, true, false, false, true, false, 'appointment_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. SOCIAL MODULE - Posts/Content (for Social Media, Blogs, Education Platforms)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('SOCIAL', 'posts', 'post_id', 'UUID', 'Post ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique post ID', 1, false, true, true, false, false, false, true, true, 'post_master'),
('SOCIAL', 'posts', 'author_id', 'UUID', 'Author', 'Author', 'dropdown', 'select', 'author', 'Post author', 2, false, false, true, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'title', 'VARCHAR(500)', 'Title', 'Title', 'text_input', 'text', 'content', 'Post title', 3, true, false, false, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'content', 'TEXT', 'Content', 'Content', 'rich_text', 'textarea', 'content', 'Post content', 4, false, false, true, true, false, false, true, false, 'post_master'),
('SOCIAL', 'posts', 'category', 'VARCHAR(100)', 'Category', 'Category', 'dropdown', 'select', 'classification', 'Post category', 5, true, false, false, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'tags', 'TEXT', 'Tags', 'Tags', 'tags_input', 'text', 'classification', 'Post tags (comma-separated)', 6, true, false, false, true, true, false, true, false, 'post_master'),
('SOCIAL', 'posts', 'image', 'TEXT', 'Featured Image', 'Image', 'image_upload', 'file', 'media', 'Post image', 7, true, false, false, true, false, false, true, false, 'post_master'),
('SOCIAL', 'posts', 'video_url', 'TEXT', 'Video URL', 'Video', 'url_input', 'url', 'media', 'Video link', 8, true, false, false, true, false, false, true, false, 'post_master'),
('SOCIAL', 'posts', 'post_type', 'VARCHAR(50)', 'Post Type', 'Type', 'dropdown', 'select', 'classification', 'Article/Video/Image/Poll', 9, false, false, true, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'visibility', 'VARCHAR(50)', 'Visibility', 'Visibility', 'dropdown', 'select', 'privacy', 'Public/Private/Friends', 10, false, false, true, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'likes_count', 'INTEGER', 'Likes', 'Likes', 'number_input', 'number', 'engagement', 'Total likes', 11, true, false, false, true, false, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'comments_count', 'INTEGER', 'Comments', 'Comments', 'number_input', 'number', 'engagement', 'Total comments', 12, true, false, false, true, false, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'shares_count', 'INTEGER', 'Shares', 'Shares', 'number_input', 'number', 'engagement', 'Total shares', 13, true, false, false, true, false, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'published_date', 'TIMESTAMP', 'Published Date', 'Published', 'datetime', 'datetime', 'timeline', 'Published date & time', 14, true, false, false, true, true, true, true, false, 'post_master'),
('SOCIAL', 'posts', 'status', 'VARCHAR(20)', 'Status', 'Status', 'dropdown', 'select', 'status', 'Draft/Published/Archived', 15, false, false, true, true, true, true, true, false, 'post_master');

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  total_records INTEGER;
  by_module RECORD;
  by_table RECORD;
BEGIN
  SELECT COUNT(*) INTO total_records FROM data_model_registry;
  
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ COMMON BUSINESS DATA MODEL - SEED COMPLETE';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total Field Definitions: %', total_records;
  RAISE NOTICE '';
  
  RAISE NOTICE 'Records by Module:';
  FOR by_module IN 
    SELECT module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY module 
    ORDER BY module
  LOOP
    RAISE NOTICE '  • % : % fields', by_module.module, by_module.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Tables by Business Type:';
  FOR by_table IN 
    SELECT table_name, module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY table_name, module
    ORDER BY module, table_name
  LOOP
    RAISE NOTICE '  • % (%) : % fields', by_table.table_name, by_table.module, by_table.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 INDUSTRY-READY TABLES:';
  RAISE NOTICE '  ✅ CORE: business (Business Profile)';
  RAISE NOTICE '  ✅ CUSTOMERS: customers (Customer Management)';
  RAISE NOTICE '  ✅ PRODUCTS: products (Product Catalog)';
  RAISE NOTICE '  ✅ SERVICES: services (Service Catalog)';
  RAISE NOTICE '  ✅ ORDERS: orders (Sales Transactions)';
  RAISE NOTICE '  ✅ INVENTORY: inventory (Stock Management)';
  RAISE NOTICE '  ✅ EMPLOYEES: employees (Team Management)';
  RAISE NOTICE '  ✅ FINANCE: invoices (Billing & Payments)';
  RAISE NOTICE '  ✅ APPOINTMENTS: appointments (Booking/Scheduling)';
  RAISE NOTICE '  ✅ SOCIAL: posts (Content Management)';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 APPLICABLE FOR:';
  RAISE NOTICE '  • Retail Stores (products, inventory, orders)';
  RAISE NOTICE '  • Medical Clinics (appointments, patients, services)';
  RAISE NOTICE '  • Restaurants (products as menu, orders, inventory)';
  RAISE NOTICE '  • Software Companies (services, customers, invoices)';
  RAISE NOTICE '  • Schools/Coaching (appointments as classes, students)';
  RAISE NOTICE '  • Social Media (posts, customers as users)';
  RAISE NOTICE '  • Service Businesses (services, appointments, invoices)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Ready for ANY business type with user-friendly names!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. ADDRESS MODULE - Address Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('ADDRESS', 'addresses', 'address_id', 'UUID', 'Address ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique address identifier', 1, false, true, true, false, false, false, true, true, 'address_mgmt'),
('ADDRESS', 'addresses', 'entity_type', 'VARCHAR(50)', 'Entity Type', 'For', 'dropdown', 'select', 'classification', 'Customer/Business/Employee/Other', 2, false, false, true, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'entity_id', 'UUID', 'Entity ID', 'Entity ID', 'text_input', 'text', 'identification', 'Reference to entity', 3, false, false, true, false, false, false, true, true, 'address_mgmt'),
('ADDRESS', 'addresses', 'address_type', 'VARCHAR(50)', 'Address Type', 'Type', 'dropdown', 'select', 'classification', 'Home/Office/Billing/Shipping/Other', 4, false, false, true, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'street_address', 'TEXT', 'Street Address', 'Street', 'textarea', 'textarea', 'location', 'Building/Street address', 5, false, false, true, true, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'apartment_number', 'VARCHAR(50)', 'Apartment/Unit', 'Apt/Unit', 'text_input', 'text', 'location', 'Apartment/Suite number', 6, true, false, false, true, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'landmark', 'VARCHAR(255)', 'Landmark', 'Landmark', 'text_input', 'text', 'location', 'Nearby landmark', 7, true, false, false, true, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'city', 'VARCHAR(100)', 'City', 'City', 'text_input', 'text', 'location', 'City name', 8, false, false, true, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'state', 'VARCHAR(100)', 'State', 'State', 'text_input', 'text', 'location', 'State/Province', 9, true, false, false, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'postal_code', 'VARCHAR(20)', 'Postal Code', 'ZIP', 'text_input', 'text', 'location', 'ZIP/Postal code', 10, false, false, true, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'country', 'VARCHAR(100)', 'Country', 'Country', 'dropdown', 'select', 'location', 'Country', 11, false, false, true, true, true, true, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'latitude', 'DECIMAL(10,8)', 'Latitude', 'Latitude', 'text_input', 'text', 'location', 'Geographic latitude', 12, true, false, false, false, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'longitude', 'DECIMAL(11,8)', 'Longitude', 'Longitude', 'text_input', 'text', 'location', 'Geographic longitude', 13, true, false, false, false, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'is_primary', 'BOOLEAN', 'Is Primary', 'Primary Address', 'toggle', 'checkbox', 'status', 'Mark as primary address', 14, false, false, true, true, false, false, true, false, 'address_mgmt'),
('ADDRESS', 'addresses', 'is_active', 'BOOLEAN', 'Active', 'Active', 'toggle', 'checkbox', 'status', 'Address is active', 15, false, false, true, true, true, false, true, false, 'address_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. CITY MODULE - City/Location Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('CITY', 'cities', 'city_id', 'UUID', 'City ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique city identifier', 1, false, true, true, false, false, false, true, true, 'city_mgmt'),
('CITY', 'cities', 'city_name', 'VARCHAR(100)', 'City Name', 'City Name', 'text_input', 'text', 'basic_info', 'Name of the city', 2, false, false, true, true, true, true, true, false, 'city_mgmt'),
('CITY', 'cities', 'city_code', 'VARCHAR(50)', 'City Code', 'Code', 'text_input', 'text', 'identification', 'Unique city code', 3, true, false, false, true, true, true, true, false, 'city_mgmt'),
('CITY', 'cities', 'state', 'VARCHAR(100)', 'State', 'State', 'text_input', 'text', 'location', 'State/Province', 4, false, false, true, true, true, true, true, false, 'city_mgmt'),
('CITY', 'cities', 'country', 'VARCHAR(100)', 'Country', 'Country', 'dropdown', 'select', 'location', 'Country', 5, false, false, true, true, true, true, true, false, 'city_mgmt'),
('CITY', 'cities', 'latitude', 'DECIMAL(10,8)', 'Latitude', 'Latitude', 'text_input', 'text', 'location', 'Geographic latitude', 6, true, false, false, false, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'longitude', 'DECIMAL(11,8)', 'Longitude', 'Longitude', 'text_input', 'text', 'location', 'Geographic longitude', 7, true, false, false, false, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'timezone', 'VARCHAR(50)', 'Timezone', 'Timezone', 'dropdown', 'select', 'settings', 'City timezone', 8, true, false, false, true, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'population', 'INTEGER', 'Population', 'Population', 'number_input', 'number', 'additional', 'City population', 9, true, false, false, true, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'area_sq_km', 'DECIMAL(10,2)', 'Area (km²)', 'Area', 'number_input', 'number', 'additional', 'Area in square kilometers', 10, true, false, false, true, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'pincode', 'VARCHAR(20)', 'PIN Code', 'PIN', 'text_input', 'text', 'identification', 'Main PIN code', 11, true, false, false, true, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'additional', 'City description', 12, true, false, false, true, false, false, true, false, 'city_mgmt'),
('CITY', 'cities', 'is_active', 'BOOLEAN', 'Active', 'Active', 'toggle', 'checkbox', 'status', 'City is active', 13, false, false, true, true, true, false, true, false, 'city_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. PROJECT MODULE - Project Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('PROJECT', 'projects', 'project_id', 'UUID', 'Project ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique project identifier', 1, false, true, true, false, false, false, true, true, 'project_mgmt'),
('PROJECT', 'projects', 'project_code', 'VARCHAR(50)', 'Project Code', 'Code', 'text_input', 'text', 'identification', 'Unique project code', 2, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'project_name', 'VARCHAR(255)', 'Project Name', 'Name', 'text_input', 'text', 'basic_info', 'Project name', 3, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'description', 'TEXT', 'Description', 'Description', 'rich_text', 'textarea', 'basic_info', 'Detailed project description', 4, true, false, false, true, false, false, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'project_type', 'VARCHAR(50)', 'Project Type', 'Type', 'dropdown', 'select', 'classification', 'Software/Construction/Research/Other', 5, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'client_id', 'UUID', 'Client ID', 'Client', 'dropdown', 'select', 'identification', 'Client/Customer reference', 6, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'project_manager_id', 'UUID', 'Project Manager', 'Manager', 'dropdown', 'select', 'organization', 'Assigned project manager', 7, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'start_date', 'DATE', 'Start Date', 'Start', 'date_picker', 'date', 'timeline', 'Project start date', 8, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'end_date', 'DATE', 'End Date', 'End', 'date_picker', 'date', 'timeline', 'Project end date', 9, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'budget', 'DECIMAL(15,2)', 'Budget', 'Budget', 'number_input', 'number', 'financial', 'Project budget', 10, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'budget_currency', 'VARCHAR(3)', 'Budget Currency', 'Currency', 'dropdown', 'select', 'financial', 'Budget currency', 11, true, false, false, true, false, false, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'estimated_cost', 'DECIMAL(15,2)', 'Est. Cost', 'Est. Cost', 'number_input', 'number', 'financial', 'Estimated project cost', 12, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'spent_amount', 'DECIMAL(15,2)', 'Spent Amount', 'Spent', 'number_input', 'number', 'financial', 'Amount spent so far', 13, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'location', 'VARCHAR(255)', 'Location', 'Location', 'text_input', 'text', 'location', 'Project location/site', 14, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'priority', 'VARCHAR(20)', 'Priority', 'Priority', 'dropdown', 'select', 'status', 'Low/Medium/High/Critical', 15, true, false, false, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'status', 'VARCHAR(50)', 'Status', 'Status', 'dropdown', 'select', 'status', 'Planning/Active/On-Hold/Completed', 16, false, false, true, true, true, true, true, false, 'project_mgmt'),
('PROJECT', 'projects', 'progress_percentage', 'INTEGER', 'Progress %', 'Progress', 'number_input', 'number', 'status', 'Project completion percentage', 17, false, false, true, true, true, true, true, false, 'project_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. COST MODULE - Cost Tracking & Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('COST', 'costs', 'cost_id', 'UUID', 'Cost ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique cost identifier', 1, false, true, true, false, false, false, true, true, 'cost_mgmt'),
('COST', 'costs', 'cost_code', 'VARCHAR(50)', 'Cost Code', 'Code', 'text_input', 'text', 'identification', 'Unique cost code', 2, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'cost_name', 'VARCHAR(255)', 'Cost Name', 'Name', 'text_input', 'text', 'basic_info', 'Cost description', 3, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'cost_category', 'VARCHAR(100)', 'Cost Category', 'Category', 'dropdown', 'select', 'classification', 'Material/Labor/Equipment/Overhead/Other', 4, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'cost_type', 'VARCHAR(50)', 'Cost Type', 'Type', 'dropdown', 'select', 'classification', 'Fixed/Variable/One-time', 5, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'project_id', 'UUID', 'Project ID', 'Project', 'dropdown', 'select', 'identification', 'Associated project', 6, true, false, false, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'vendor_id', 'UUID', 'Vendor ID', 'Vendor', 'dropdown', 'select', 'identification', 'Vendor/Supplier reference', 7, true, false, false, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'amount', 'DECIMAL(15,2)', 'Amount', 'Amount', 'number_input', 'number', 'financial', 'Cost amount', 8, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Cost currency', 9, false, false, true, true, false, false, true, false, 'cost_mgmt'),
('COST', 'costs', 'cost_date', 'DATE', 'Cost Date', 'Date', 'date_picker', 'date', 'timeline', 'Date of cost incurrence', 10, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'payment_status', 'VARCHAR(50)', 'Payment Status', 'Status', 'dropdown', 'select', 'status', 'Pending/Paid/Cancelled', 11, false, false, true, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'payment_method', 'VARCHAR(50)', 'Payment Method', 'Method', 'dropdown', 'select', 'payment', 'Cash/Card/Check/Transfer/Other', 12, true, false, false, true, true, true, true, false, 'cost_mgmt'),
('COST', 'costs', 'invoice_number', 'VARCHAR(100)', 'Invoice Number', 'Invoice', 'text_input', 'text', 'identification', 'Vendor invoice number', 13, true, false, false, true, false, false, true, false, 'cost_mgmt'),
('COST', 'costs', 'receipt_url', 'TEXT', 'Receipt URL', 'Receipt', 'file_upload', 'file', 'additional', 'Receipt file attachment', 14, true, false, false, true, false, false, true, false, 'cost_mgmt'),
('COST', 'costs', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'additional', 'Cost details', 15, true, false, false, true, false, false, true, false, 'cost_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. REGION MODULE - Regional Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('REGION', 'regions', 'region_id', 'UUID', 'Region ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique region identifier', 1, false, true, true, false, false, false, true, true, 'region_mgmt'),
('REGION', 'regions', 'region_code', 'VARCHAR(50)', 'Region Code', 'Code', 'text_input', 'text', 'identification', 'Unique region code', 2, false, false, true, true, true, true, true, false, 'region_mgmt'),
('REGION', 'regions', 'region_name', 'VARCHAR(100)', 'Region Name', 'Name', 'text_input', 'text', 'basic_info', 'Name of the region', 3, false, false, true, true, true, true, true, false, 'region_mgmt'),
('REGION', 'regions', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'basic_info', 'Region description', 4, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'region_type', 'VARCHAR(50)', 'Region Type', 'Type', 'dropdown', 'select', 'classification', 'Sales/Service/Distribution/Support', 5, true, false, false, true, true, true, true, false, 'region_mgmt'),
('REGION', 'regions', 'parent_region_id', 'UUID', 'Parent Region', 'Parent', 'dropdown', 'select', 'identification', 'Parent region (for hierarchy)', 6, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'countries', 'TEXT', 'Countries', 'Countries', 'tags_input', 'tags', 'location', 'Countries in region', 7, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'manager_id', 'UUID', 'Region Manager', 'Manager', 'dropdown', 'select', 'organization', 'Regional manager', 8, true, false, false, true, true, true, true, false, 'region_mgmt'),
('REGION', 'regions', 'headquarters_address', 'VARCHAR(255)', 'HQ Address', 'Address', 'text_input', 'text', 'location', 'Regional headquarters', 9, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'phone', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Regional office phone', 10, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'email', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Regional office email', 11, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'annual_revenue_target', 'DECIMAL(15,2)', 'Revenue Target', 'Target', 'number_input', 'number', 'financial', 'Annual revenue target', 12, true, false, false, true, false, false, true, false, 'region_mgmt'),
('REGION', 'regions', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 13, false, false, true, true, true, false, true, false, 'region_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 16. TEAM MODULE - Team Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('TEAM', 'teams', 'team_id', 'UUID', 'Team ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique team identifier', 1, false, true, true, false, false, false, true, true, 'team_mgmt'),
('TEAM', 'teams', 'team_code', 'VARCHAR(50)', 'Team Code', 'Code', 'text_input', 'text', 'identification', 'Unique team code', 2, false, false, true, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'team_name', 'VARCHAR(255)', 'Team Name', 'Name', 'text_input', 'text', 'basic_info', 'Team name', 3, false, false, true, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'description', 'TEXT', 'Description', 'Description', 'textarea', 'textarea', 'basic_info', 'Team description', 4, true, false, false, true, false, false, true, false, 'team_mgmt'),
('TEAM', 'teams', 'team_type', 'VARCHAR(50)', 'Team Type', 'Type', 'dropdown', 'select', 'classification', 'Engineering/Sales/Support/HR/Finance', 5, false, false, true, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'department', 'VARCHAR(100)', 'Department', 'Department', 'text_input', 'text', 'organization', 'Department name', 6, true, false, false, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'team_lead_id', 'UUID', 'Team Lead', 'Lead', 'dropdown', 'select', 'organization', 'Team lead employee', 7, false, false, true, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'member_count', 'INTEGER', 'Member Count', 'Members', 'number_input', 'number', 'organization', 'Number of team members', 8, true, false, false, true, true, false, true, false, 'team_mgmt'),
('TEAM', 'teams', 'office_location', 'VARCHAR(255)', 'Office Location', 'Location', 'text_input', 'text', 'location', 'Team office location', 9, true, false, false, true, true, true, true, false, 'team_mgmt'),
('TEAM', 'teams', 'established_date', 'DATE', 'Est. Date', 'Est. Date', 'date_picker', 'date', 'timeline', 'Team establishment date', 10, true, false, false, true, false, false, true, false, 'team_mgmt'),
('TEAM', 'teams', 'budget_allocated', 'DECIMAL(15,2)', 'Budget', 'Budget', 'number_input', 'number', 'financial', 'Annual budget allocated', 11, true, false, false, true, false, false, true, false, 'team_mgmt'),
('TEAM', 'teams', 'budget_currency', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Budget currency', 12, true, false, false, true, false, false, true, false, 'team_mgmt'),
('TEAM', 'teams', 'status', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active/Inactive', 13, false, false, true, true, true, false, true, false, 'team_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 17. SCRUM MODULE - Agile/Scrum Framework Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('SCRUM', 'sprints', 'sprint_id', 'UUID', 'Sprint ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique sprint identifier', 1, false, true, true, false, false, false, true, true, 'scrum_mgmt'),
('SCRUM', 'sprints', 'sprint_code', 'VARCHAR(50)', 'Sprint Code', 'Code', 'text_input', 'text', 'identification', 'Unique sprint code', 2, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'sprint_name', 'VARCHAR(255)', 'Sprint Name', 'Name', 'text_input', 'text', 'basic_info', 'Sprint name', 3, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'project_id', 'UUID', 'Project ID', 'Project', 'dropdown', 'select', 'identification', 'Associated project', 4, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'team_id', 'UUID', 'Team ID', 'Team', 'dropdown', 'select', 'identification', 'Scrum team', 5, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'scrum_master_id', 'UUID', 'Scrum Master', 'Master', 'dropdown', 'select', 'organization', 'Scrum master', 6, true, false, false, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'product_owner_id', 'UUID', 'Product Owner', 'Owner', 'dropdown', 'select', 'organization', 'Product owner', 7, true, false, false, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'start_date', 'DATE', 'Start Date', 'Start', 'date_picker', 'date', 'timeline', 'Sprint start date', 8, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'end_date', 'DATE', 'End Date', 'End', 'date_picker', 'date', 'timeline', 'Sprint end date', 9, false, false, true, true, true, true, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'duration_days', 'INTEGER', 'Duration (Days)', 'Duration', 'number_input', 'number', 'timeline', 'Sprint duration in days', 10, false, false, true, true, false, false, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'sprint_goal', 'TEXT', 'Sprint Goal', 'Goal', 'rich_text', 'textarea', 'basic_info', 'Sprint objective', 11, true, false, false, true, false, false, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'planned_velocity', 'INTEGER', 'Planned Velocity', 'Velocity', 'number_input', 'number', 'status', 'Planned story points', 12, true, false, false, true, false, false, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'actual_velocity', 'INTEGER', 'Actual Velocity', 'Actual', 'number_input', 'number', 'status', 'Actual completed points', 13, true, false, false, true, false, false, true, false, 'scrum_mgmt'),
('SCRUM', 'sprints', 'status', 'VARCHAR(50)', 'Status', 'Status', 'dropdown', 'select', 'status', 'Planned/Active/Completed', 14, false, false, true, true, true, true, true, false, 'scrum_mgmt');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 18. TASK MODULE - Task Management
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('TASK', 'tasks', 'task_id', 'UUID', 'Task ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique task identifier', 1, false, true, true, false, false, false, true, true, 'task_mgmt'),
('TASK', 'tasks', 'task_code', 'VARCHAR(50)', 'Task Code', 'Code', 'text_input', 'text', 'identification', 'Unique task code', 2, false, false, true, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'task_title', 'VARCHAR(255)', 'Task Title', 'Title', 'text_input', 'text', 'basic_info', 'Task title', 3, false, false, true, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'description', 'TEXT', 'Description', 'Description', 'rich_text', 'textarea', 'basic_info', 'Detailed task description', 4, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'task_type', 'VARCHAR(50)', 'Task Type', 'Type', 'dropdown', 'select', 'classification', 'Bug/Feature/Epic/Story/Subtask', 5, false, false, true, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'project_id', 'UUID', 'Project ID', 'Project', 'dropdown', 'select', 'identification', 'Associated project', 6, true, false, false, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'sprint_id', 'UUID', 'Sprint ID', 'Sprint', 'dropdown', 'select', 'identification', 'Associated sprint', 7, true, false, false, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'assigned_to', 'UUID', 'Assigned To', 'Assignee', 'dropdown', 'select', 'organization', 'Team member', 8, true, false, false, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'created_by', 'UUID', 'Created By', 'Creator', 'text_input', 'text', 'organization', 'Task creator', 9, false, false, true, false, false, false, true, true, 'task_mgmt'),
('TASK', 'tasks', 'priority', 'VARCHAR(20)', 'Priority', 'Priority', 'dropdown', 'select', 'status', 'Lowest/Low/Medium/High/Highest', 10, false, false, true, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'status', 'VARCHAR(50)', 'Status', 'Status', 'dropdown', 'select', 'status', 'Backlog/Todo/In-Progress/In-Review/Done', 11, false, false, true, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'story_points', 'INTEGER', 'Story Points', 'Points', 'number_input', 'number', 'status', 'Effort estimation', 12, true, false, false, true, true, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'time_estimated_hours', 'DECIMAL(10,2)', 'Est. Hours', 'Hours', 'number_input', 'number', 'timeline', 'Estimated hours', 13, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'time_spent_hours', 'DECIMAL(10,2)', 'Spent Hours', 'Spent', 'number_input', 'number', 'timeline', 'Hours spent', 14, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'due_date', 'DATE', 'Due Date', 'Due', 'date_picker', 'date', 'timeline', 'Task due date', 15, true, false, false, true, true, true, true, false, 'task_mgmt'),
('TASK', 'tasks', 'start_date', 'DATE', 'Start Date', 'Start', 'date_picker', 'date', 'timeline', 'Task start date', 16, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'completion_date', 'DATE', 'Completed Date', 'Completed', 'date_picker', 'date', 'timeline', 'Task completion date', 17, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'tags', 'TEXT', 'Tags', 'Tags', 'tags_input', 'tags', 'classification', 'Task tags', 18, true, false, false, true, true, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'attachments', 'TEXT', 'Attachments', 'Files', 'file_upload', 'file', 'additional', 'File attachments', 19, true, false, false, true, false, false, true, false, 'task_mgmt'),
('TASK', 'tasks', 'comments_count', 'INTEGER', 'Comments', 'Comments', 'number_input', 'number', 'additional', 'Number of comments', 20, true, false, false, true, false, false, true, false, 'task_mgmt');

DO $$
DECLARE
  total_count INTEGER;
  by_module RECORD;
  by_table RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DATA MODEL REGISTRY - COMPLETE BUSINESS DATA MODEL';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO total_count FROM data_model_registry;
  RAISE NOTICE '📊 TOTAL FIELDS REGISTERED: % fields', total_count;
  RAISE NOTICE '';
  
  RAISE NOTICE 'Records by Module:';
  FOR by_module IN 
    SELECT module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY module 
    ORDER BY module
  LOOP
    RAISE NOTICE '  • % : % fields', by_module.module, by_module.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Tables by Business Type:';
  FOR by_table IN 
    SELECT table_name, module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY table_name, module
    ORDER BY module, table_name
  LOOP
    RAISE NOTICE '  • % (%) : % fields', by_table.table_name, by_table.module, by_table.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 INDUSTRY-READY TABLES (18 TOTAL):';
  RAISE NOTICE '  ✅ CORE: business (Business Profile)';
  RAISE NOTICE '  ✅ CUSTOMERS: customers (Customer Management)';
  RAISE NOTICE '  ✅ PRODUCTS: products (Product Catalog)';
  RAISE NOTICE '  ✅ SERVICES: services (Service Catalog)';
  RAISE NOTICE '  ✅ ORDERS: orders (Sales Transactions)';
  RAISE NOTICE '  ✅ INVENTORY: inventory (Stock Management)';
  RAISE NOTICE '  ✅ EMPLOYEES: employees (Team Management)';
  RAISE NOTICE '  ✅ FINANCE: invoices (Billing & Payments)';
  RAISE NOTICE '  ✅ APPOINTMENTS: appointments (Booking/Scheduling)';
  RAISE NOTICE '  ✅ SOCIAL: posts (Content Management)';
  RAISE NOTICE '  ✅ ADDRESS: addresses (Address Management)';
  RAISE NOTICE '  ✅ CITY: cities (City/Location Management)';
  RAISE NOTICE '  ✅ PROJECT: projects (Project Management)';
  RAISE NOTICE '  ✅ COST: costs (Cost Tracking)';
  RAISE NOTICE '  ✅ REGION: regions (Regional Management)';
  RAISE NOTICE '  ✅ TEAM: teams (Team Management)';
  RAISE NOTICE '  ✅ SCRUM: sprints (Agile/Scrum Management)';
  RAISE NOTICE '  ✅ TASK: tasks (Task Management)';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 APPLICABLE FOR:';
  RAISE NOTICE '  • Retail Stores (products, inventory, orders, addresses, teams)';
  RAISE NOTICE '  • Medical Clinics (appointments, patients, services, projects, teams)';
  RAISE NOTICE '  • Restaurants (products as menu, orders, inventory, regions, locations)';
  RAISE NOTICE '  • Software Companies (services, customers, invoices, projects, sprints, tasks)';
  RAISE NOTICE '  • Schools/Coaching (appointments as classes, students, teams, projects)';
  RAISE NOTICE '  • Social Media (posts, customers as users, teams)';
  RAISE NOTICE '  • Service Businesses (services, appointments, invoices, projects, teams)';
  RAISE NOTICE '  • Corporate (all 18 modules - comprehensive enterprise solution)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Ready for ANY business type with 350+ user-friendly fields!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;