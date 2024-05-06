import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, DisplayText, Note, FormControl, TextInput, Select, Table } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

type TagProps = {
  sys: any;
  name: string;
};

export interface AppInstallationParameters { }

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma;
  const currentEnvironment = sdk.ids.environmentAlias ?? sdk.ids.environment
  const [spaceId, setSpaceId] = useState<string | undefined>()
  const [brandTags, setBrandTags] = useState<TagProps[]>()
  const [productTags, setProductTags] = useState<TagProps[]>()

  const [selectedBrand, setSelectedBrand] = useState();
  const [selectedProduct, setSelectedProduct] = useState();

  const handleOnBrandSelectedChange = (event) => setSelectedBrand(event.target.value);
  const handleOnProductSelectedChange = (event) => setSelectedProduct(event.target.value);


  useEffect(() => {
    cma.space.get({})
      .then(s => setSpaceId(s.sys.id))
  }, [cma.space])

  useEffect(() => {
    if (spaceId) {
      cma.tag.getMany({
        spaceId: spaceId,
        environmentId: currentEnvironment
      }).then(tags => {
        const _productTags = tags.items.filter(item => item.name.toLowerCase().startsWith('product:'))
        const _brandTags = tags.items.filter(item => item.name.toLowerCase().startsWith('brand:'))
        setBrandTags(_brandTags)
        setProductTags(_productTags)
      })
    }
  }, [cma.tag, currentEnvironment, spaceId])

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })} gap="spacingS">
      <DisplayText>This settings are applied to: {currentEnvironment.toLowerCase() === 'master' ? 'PRODUCTION' : currentEnvironment.toUpperCase()} environment</DisplayText>
      <Note variant="warning" title="This app requires the tags to be created in the space. The tags should be named as follows:">
        <Paragraph>
          <b>Brand:</b> Brand:brand-name
        </Paragraph>
        <Paragraph>
          <b>Product:</b> Product:product-name
        </Paragraph>
      </Note>
      <Form>
        <Heading>Remoted App URL Config</Heading>
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>URL</Table.Cell>
              <Table.Cell>Brand</Table.Cell>
              <Table.Cell>Product</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {
              brandTags?.map(brand => {
                return (
                  productTags?.map(product => {
                    return (
                      <Table.Row key={brand.sys.id + product.sys.id}>
                        <Table.Cell>
                          <FormControl>
                            <FormControl.Label isRequired>URL</FormControl.Label>
                            <TextInput />
                            <FormControl.HelpText>Enter the remoted app url for each Brand and Product</FormControl.HelpText>
                          </FormControl>
                        </Table.Cell>
                        <Table.Cell>{brand.name.replace('Brand:', '')}</Table.Cell>
                        <Table.Cell>{product.name.replace('Product:', '')}</Table.Cell>
                      </Table.Row>
                    )
                  })
                )
              })
            }
          </Table.Body>
        </Table>

      </Form>

    </Flex>
  );
};

export default ConfigScreen;
