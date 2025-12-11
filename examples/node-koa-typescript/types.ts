/**
 * Triggers are messages the Experience is configured to listen and
 * react to. Each Trigger will be exposed as a button in Producer
 * for the given Experience. When the Tagboard user clicks one of these
 * buttons, a message will be posted to the Experience within an IFrame.
 * How the Experience responds to these messages is up to the Partner.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
 */
interface Trigger {
  id: string;

  // Key is the string that we post to the IFrame via postMessage.
  key: string

  // Label is what is put on the button in Producer.
  label: string
}

/**
 * FieldOptions are the available options the Tagboard user
 * will be able to choose from when setting up the Experience.
 */
interface FieldOption {
  id: string;

  // Value is the actual data for the option. This is what will be sent to the Experience
  // via the TemplateUrl.
  value: string

  // Label is how the Tagboard user will see the data in any dropdowns
  // when editing the Experience.
  label: string
}

/**
 * Fields are the available overrides for any given Experience.
 */
interface Field {
  id: string;

  // Key is a unique identifier for the Field.
  // It is used to find where the data should go in the Experience's TemplateUrl.
  // For example Key:player_id would replace all instances of "{{player_id}}" in
  // Experience.TemplateUrl.
  key: string

  // Label is used to describe the input within the UI of Tagboard.
  label: string;

  // DefaultValue controls what the initial value should be set to
  // when the Tagboard user starts configuring the Experience.
  // This is optional.
  defaultValue: string

  // Options are all the available field options the Tagboard user has to choose from.
  options: FieldOption[]

  // IsText controls whether the Field will display as a dropdown or plaintext input
  // for the Tagboard users.
  isText: boolean
}

/**
 * Experiences are encompassing component that will be used to
 * drive the HTML (IFrame) graphic element.
 */
interface Experience {
  // Unique identifier for the Experience.
  id: string

  // Name of the Experience.
  name: string

  // Description of the Experience.
  description: string

  // Type of the Experience. Can be used for grouping like Experiences together,
  // or pushing Tagboard users to use certain Experiences based on templates.
  type: string;

  // URL used to render the Experience within an IFrame.
  // Should be a template string with editable values replaced with template blocks.
  // e.g. https://experience.tagboard.com/{{experience_id}}?player={{player_id}}
  // where `{{experience_id}}` is Experience.ID and `{{player_id}}` would be replaced with
  // the Field.Value of any Field where Field.Key is "player_id".
  url: string

  // QR Code URL. The destination end user's should be sent when scanning a code on the screen.
  // This can be the same as the Experience URL, or a different destination altogether.
  qrCodeUrl: string

  // Triggers that we will expose in Producer as buttons that
  // post messages to the Experience Iframe.
  triggers: Trigger[]

  // The additional fields the Tagboard user will be able
  // to configure on the Experience. This could be something like
  // which "player" is shown, or what "match" is used for reference.
  fields: Field[]
}

/**********************/
/* Non-PDK Interfaces */
/**********************/

interface User {
  id: string
  username: string
  password: string
}
