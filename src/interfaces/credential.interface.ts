export enum SellsyCredentialNameEnum {
  ConsumerToken = "consumerToken",
  ConsumerSecret = "consumerSecret",
  UserToken = "userToken",
  UserSecret = "userSecret",
}

export enum KlaviyoCredentialNameEnum {
  PublicApiKey = "publicApiKey",
  PrivateApiKey = "privateApiKey",
}

export enum CredentialsScopeEnum {
  Test = "test",
  Sellsy = "sellsy",
  Klaviyo = "klaviyo",
}

export const matchCredentialScopeName = {
  [CredentialsScopeEnum.Test]: [""],
  [CredentialsScopeEnum.Klaviyo]: Object.keys(KlaviyoCredentialNameEnum),
  [CredentialsScopeEnum.Sellsy]: Object.keys(SellsyCredentialNameEnum),
};

export interface Credentials {
  [CredentialsScopeEnum.Test]: string;
  [CredentialsScopeEnum.Sellsy]: SellsyCredentials;
  [CredentialsScopeEnum.Klaviyo]: KlaviyoCredentials;
}

export type CredentialKey =
  | keyof SellsyCredentialNameEnum
  | keyof KlaviyoCredentialNameEnum;

export type CredentialsType = SellsyCredentials | KlaviyoCredentials;

export interface SellsyCredentials {
  [SellsyCredentialNameEnum.ConsumerSecret]: string;
  [SellsyCredentialNameEnum.ConsumerToken]: string;
  [SellsyCredentialNameEnum.UserToken]: string;
  [SellsyCredentialNameEnum.UserSecret]: string;
}

export interface KlaviyoCredentials {
  [KlaviyoCredentialNameEnum.PrivateApiKey]: string;
  [KlaviyoCredentialNameEnum.PublicApiKey]: string;
}
