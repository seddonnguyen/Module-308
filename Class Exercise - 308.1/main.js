// 1) Print all even numbers from 0 to 100.
// 2) Print all odd numbers from 0 to 100.
// 3) Given a number, determine if the number is prime, and print "Yes" or "No."
// 4) Print all numbers divisible by 4 and 6 for all numbers between 10 and 1,000 (inclusive).

// 1) Print all even numbers from 0 to 100.
console.log("Print all even numbers from 0 to 100.")
for (let i = 0; i <= 100; i++) {
  if (i % 2 === 0) {
    console.log(i);
  }
}
console.log("\n");

// 2) Print all odd numbers from 0 to 100.
console.log("Print all odd numbers from 0 to 100.")
for (let i = 0; i <= 100; i++) {
  if (i % 2 !== 0) {
    console.log(i);
  }
}
console.log("\n");

// 3) Given a number, determine if the number is prime, and print "Yes" or "No."
console.log("Given a number, determine if the number is prime, and print 'Yes' or 'No'.")
function isPrime(num) {
    if (num <= 1) {
        return false;
    }
    for (let i = 2; i < num; i++) {
        if (num % i === 0) {
        return false;
        }
    }
    return true;
}

function printPrime(num) {
    if (isPrime(num)) {
        console.log("Yes");
    } else {
        console.log("No");
    }
}

console.log("Test cases:");
console.log("Number 1 is prime? " + isPrime(1)); // false
console.log("Number 2 is prime? " + isPrime(2)); // true
console.log("Number 3 is prime? " + isPrime(3)); // true
console.log("Number 4 is prime? " + isPrime(4)); // false
console.log("Number 5 is prime? " + isPrime(5)); // true
console.log("Number 6 is prime? " + isPrime(6)); // false
console.log("Number 7 is prime? " + isPrime(7)); // true
console.log("\n");

// 4) Print all numbers divisible by 4 and 6 for all numbers between 10 and 1,000 (inclusive).
console.log("Print all numbers divisible by 4 and 6 for all numbers between 10 and 1,000 (inclusive).")
for (let i = 10; i <= 1000; i++) {
  if (i % 4 === 0 && i % 6 === 0) {
    console.log(i);
  }
}