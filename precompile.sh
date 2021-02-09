#!/bin/bash
mkdir -p ./public/templates

handlebars views/partials/empireItem.handlebars -f public/templates/empire_item_template.js
handlebars views/partials/systemItem.handlebars -f public/templates/system_item_template.js
handlebars views/partials/bodyItem.handlebars -f public/templates/body_item_template.js
handlebars views/partials/resourceItem.handlebars -f public/templates/resource_item_template.js
handlebars views/partials/hyperlaneItem.handlebars -f public/templates/hyperlane_item_template.js
handlebars views/partials/resourceStockItem.handlebars -f public/templates/resource_stock_item_template.js
