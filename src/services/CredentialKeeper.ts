import {
  Credentials,
  CredentialsScopeEnum,
  CredentialsType,
  KlaviyoCredentialNameEnum,
  KlaviyoCredentials,
  matchCredentialScopeName,
  SellsyCredentialNameEnum,
  SellsyCredentials,
} from "../interfaces/credential.interface";
import {
  ab2b64,
  b64toab,
  hashData,
  stringToArrayBuffer,
} from "../libs/Helpers";

const validTag = "-v4l1d";

class CredentialKeeper {
  private hashedPin: string = "";
  private encryptedCredentials: Credentials = this.emptyCredentials();
  private testPinCount: number = 0;

  constructor() {
    this.fetchCredentials();
  }

  private setHashedPin(pin: string) {
    this.hashedPin = pin;
  }

  public async decryptedCredentials(
    credentialScope: Omit<CredentialsScopeEnum, CredentialsScopeEnum.Test>
  ): Promise<CredentialsType> {
    switch (credentialScope) {
      case CredentialsScopeEnum.Klaviyo:
        return Object.values(KlaviyoCredentialNameEnum).reduce(
          async (accPromise, key) => {
            const acc = await accPromise; // Wait for the accumulated promise to resolve
            const hashedKey = await hashData(credentialScope + key);
            const encryptedValue = localStorage.getItem(
              `credential-${hashedKey}`
            );

            if (encryptedValue) {
              acc[key] = await this.decryptData(encryptedValue, this.hashedPin); // Decrypt and assign to the accumulator
            }

            return acc;
          },
          Promise.resolve({} as KlaviyoCredentials)
        );
      case CredentialsScopeEnum.Sellsy:
        return Object.values(SellsyCredentialNameEnum).reduce(
          async (accPromise, key) => {
            const acc = await accPromise; // Wait for the accumulated promise to resolve
            const hashedKey = await hashData(credentialScope + key);
            const encryptedValue = localStorage.getItem(
              `credential-${hashedKey}`
            );

            if (encryptedValue) {
              acc[key] = await this.decryptData(encryptedValue, this.hashedPin); // Decrypt and assign to the accumulator
            }

            return acc;
          },
          Promise.resolve({} as SellsyCredentials)
        );
      default:
        throw new Error("Invalid credential scope provided");
    }
  }

  public async secure(
    credentials: CredentialsType,
    credentialScope: CredentialsScopeEnum
  ) {
    return await Promise.all(
      Object.entries(credentials).map(
        async ([key, value]: [string, string]) => {
          const credentialValue = value.trim();

          if (credentialValue) {
            const encryptedValue = await this.encryptData(
              credentialValue,
              this.hashedPin
            );

            const credentialName = credentialScope + key;

            switch (credentialScope) {
              case CredentialsScopeEnum.Sellsy:
                (
                  this.encryptedCredentials[
                    credentialScope
                  ] as SellsyCredentials
                )[key as keyof SellsyCredentials] = encryptedValue;
                break;
              case CredentialsScopeEnum.Klaviyo:
                (
                  this.encryptedCredentials[
                    credentialScope
                  ] as KlaviyoCredentials
                )[key as keyof KlaviyoCredentials] = encryptedValue;
                break;
            }
            const hashedName = await hashData(credentialName.toString());
            localStorage.setItem(`credential-${hashedName}`, encryptedValue);
          }
        }
      )
    );
  }

  private emptyCredentials() {
    return Object.values(CredentialsScopeEnum).reduce((acc, scope) => {
      if (scope === CredentialsScopeEnum.Sellsy) {
        acc[scope] = this.createEmptySellsyCredentials();
      } else if (scope === CredentialsScopeEnum.Klaviyo) {
        acc[scope] = this.createEmptyKlaviyoCredentials();
      } else {
        acc[scope] = "";
      }
      return acc;
    }, {} as Credentials);
  }

  private createEmptySellsyCredentials(): SellsyCredentials {
    const emptySellsyCredentials: Partial<SellsyCredentials> = {};
    Object.values(SellsyCredentialNameEnum).forEach((key) => {
      emptySellsyCredentials[key] = "";
    });
    return emptySellsyCredentials as SellsyCredentials;
  }

  private createEmptyKlaviyoCredentials(): KlaviyoCredentials {
    const emptyKlaviyoCredentials: Partial<KlaviyoCredentials> = {};
    Object.values(KlaviyoCredentialNameEnum).forEach((key) => {
      emptyKlaviyoCredentials[key] = "";
    });
    return emptyKlaviyoCredentials as KlaviyoCredentials;
  }

  public get remainingPinTest(): number {
    return 3 - this.testPinCount;
  }

  public async reset() {
    const credentials = Object.keys(localStorage).filter((key) =>
      key.includes("credential-")
    );

    for (let key of credentials) {
      localStorage.removeItem(key);
    }

    this.encryptedCredentials = this.emptyCredentials();
    this.hashedPin = "";
  }

  private randomPin(length: number = 4): string[] {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 10).toString()
    );
  }

  public async fetchCredentials(): Promise<void> {
    await Promise.all(
      Object.values(CredentialsScopeEnum).map(async (credentialScope) => {
        const credentialNames = matchCredentialScopeName[credentialScope];

        await Promise.all(
          credentialNames.map(async (credentialName) => {
            const hashedName = await hashData(credentialScope + credentialName);
            const encryptedValue = localStorage.getItem(
              `credential-${hashedName}`
            );

            if (encryptedValue) {
              if (credentialScope === CredentialsScopeEnum.Sellsy) {
                (
                  this.encryptedCredentials[
                    credentialScope
                  ] as SellsyCredentials
                )[credentialName as keyof SellsyCredentials] = encryptedValue;
              } else if (credentialScope === CredentialsScopeEnum.Klaviyo) {
                (
                  this.encryptedCredentials[
                    credentialScope
                  ] as KlaviyoCredentials
                )[credentialName as keyof KlaviyoCredentials] = encryptedValue;
              }
            }
          })
        );
      })
    );
  }

  public async testPin(pin: string): Promise<boolean> {
    const hashedPin = await hashData(pin);
    const decryptedValue = await this.decryptData(
      this.encryptedCredentials[CredentialsScopeEnum.Test],
      hashedPin
    );

    const validTestPin = decryptedValue.includes(validTag);
    if (!validTestPin) {
      this.testPinCount++;
      if (this.testPinCount >= 3) {
        await this.reset();
      }
      return false;
    } else {
      this.setHashedPin(hashedPin);
      return true;
    }
  }

  private async decryptData(
    encryptedData: string,
    hashedPin: string
  ): Promise<string> {
    const ivBase64 = encryptedData.slice(-16);
    const encryptedDataBase64 = encryptedData.slice(0, -16);
    const key = await this.generateKeyFromPin(hashedPin);
    const encryptedBuffer = b64toab(encryptedDataBase64);
    const initializationVector = b64toab(ivBase64);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: initializationVector,
          tagLength: 128,
        },
        key,
        encryptedBuffer
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      return "";
    }
  }

  private async encryptData(data: string, pin: string) {
    const key = await this.generateKeyFromPin(pin);
    const initializationVector = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: initializationVector,
        tagLength: 128,
      },
      key,
      encodedData
    );

    const encryptedDataBase64 = ab2b64(encryptedBuffer);
    const ivBase64 = ab2b64(initializationVector);
    return `${encryptedDataBase64}${ivBase64}`;
  }

  private async generateKeyFromPin(pin: string) {
    const targetLength = 32;
    let expandedPin = pin;
    while (expandedPin.length < targetLength) {
      expandedPin += pin;
    }
    expandedPin = expandedPin.slice(0, targetLength);

    const pinArrayBuffer = stringToArrayBuffer(expandedPin);

    return await crypto.subtle.importKey(
      "raw",
      pinArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }
}

export default CredentialKeeper;
