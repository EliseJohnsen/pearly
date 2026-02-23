import {StructureBuilder} from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Innhold')
    .items([
      // Products section with filtering
      S.listItem()
        .title('Produkter')
        .child(
          S.list()
            .title('Produkter')
            .items([
              S.listItem()
                .title('Alle produkter')
                .child(
                  S.documentTypeList('products')
                    .title('Alle produkter')
                    .filter('_type == "products" && productType != "structure"')
                ),
              S.listItem()
                .title('Perlepakker')
                .child(
                  S.documentTypeList('products')
                    .title('Perlepakker')
                    .filter('_type == "products" && productType == "kit"')
                ),
              S.listItem()
                .title('Verktøy')
                .child(
                  S.documentTypeList('products')
                    .title('Verktøy')
                    .filter('_type == "products" && productType == "tools"')
                ),
              S.listItem()
                .title('Tilleggsvarer (Strukturprodukter)')
                .child(
                  S.documentTypeList('products')
                    .title('Tilleggsvarer')
                    .filter('_type == "products" && productType == "structure"')
                ),
            ])
        ),

      // Divider
      S.divider(),

      // All other document types (automatically added)
      ...S.documentTypeListItems().filter(
        (listItem) => !['products'].includes(listItem.getId() || '')
      ),
    ])
