export default class AuthUser {
    constructor(
      public id: string,
      public displayName: string,
      public email: string,
      public password: string,
      public phoneNumber: string,
      public profilePic?: string
    ) {}
  }
