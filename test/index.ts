"use strict";

import expect from "expect.js";
import { User } from "../lib/UserStore";

describe("dehelper", () => {
  it("should have a userstore", (done) => {
    let user: User = {
      firstname: "John",
      lastname: "Doe",
      email: "johndoe@example.com",
      userId: "28acc9f1-28f3-488d-8fe7-d0fb7682724d",
      created: new Date(),
      lastLogin: new Date(),
      failedLogins: 0,
      isDisabled: false,
      isLocked: false,
      lockedUntil: new Date(),
      roles: ["user"],
      username: "JohnDoe",
      password: null,
    };

    expect(user.firstname).equal("John");
    expect(user.lastname).equal("Doe");
    done();
  });
});
