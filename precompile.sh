#!/bin/bash
mkdir -p ./public/templates

handlebars views/partials/hyperlaneItem.handlebars -f public/templates/hyperlane_item_template.js
handlebars views/partials/modalBackdrop.handlebars -f public/templates/modal_backdrop.js
handlebars views/partials/confirmationModal.handlebars -f public/templates/confirmation_modal.js
handlebars views/partials/errorModal.handlebars -f public/templates/error_modal.js
handlebars views/partials/searchItem.handlebars -f public/templates/search_item.js
handlebars views/partials/empireResourceStockItem.handlebars -f public/templates/empire_resource_stock_item.js
handlebars views/partials/bodyResourceDepositItem.handlebars -f public/templates/body_resource_deposit_item.js
