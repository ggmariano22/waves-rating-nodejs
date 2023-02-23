//add property to NodeJs global module. To TS identify this file as a declaration
//file, we should import the supertest inline, otherwise it will be considered
//as local module instead of global
import { SuperTest, Test } from 'supertest';

declare global {
    var testRequest: SuperTest<Test>;
}