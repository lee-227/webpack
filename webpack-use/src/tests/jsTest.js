const fn = (a, b) => a + b;
fn();
function readonly(target, key, descriptor) {
  // eslint-disable-next-line no-param-reassign
  descriptor.writable = false;
}
class Person {
  @readonly name = 'lee';
}
const user = new Person();
// user.name = 'lee2';
console.log(user);
export default {
  lee: '1',
};
