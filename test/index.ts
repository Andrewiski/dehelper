"use strict";

import expect from "expect.js";

describe("deauth", () => {
  it("should have a userstore", (done) => {
    const user = new User({firstname: "John", lastname: "Doe"});
    expect(user.firstname).to.be("John");
    expect(user.firstname).to.be("Doe");
    done();
  });

  
});
