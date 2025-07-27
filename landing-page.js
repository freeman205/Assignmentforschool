// landing-page.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Navigation Buttons ---
  const loginButton = document.getElementById("loginButton")
  const signupButton = document.getElementById("signupButton")
  const heroGetStartedButton = document.getElementById("heroGetStartedButton")
  const heroLearnMoreButton = document.getElementById("heroLearnMoreButton")
  const ctaSignupButton = document.getElementById("ctaSignupButton")

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      window.location.href = "../login" // Redirect to your login page
    })
  }

  if (signupButton) {
    signupButton.addEventListener("click", () => {
      window.location.href = "../signup" // Redirect to your signup page
    })
  }

  if (heroGetStartedButton) {
    heroGetStartedButton.addEventListener("click", () => {
      window.location.href = "../signup" // Redirect to signup
    })
  }

  if (heroLearnMoreButton) {
    heroLearnMoreButton.addEventListener("click", () => {
      // Smooth scroll to the features section
      document.querySelector("#features").scrollIntoView({
        behavior: "smooth",
      })
    })
  }

  if (ctaSignupButton) {
    ctaSignupButton.addEventListener("click", () => {
      window.location.href = "../signup" // Redirect to signup
    })
  }

  // --- Smooth Scrolling for Internal Links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      })

      // Close mobile menu if open
      const mobileMenu = document.getElementById("mobileMenu")
      if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden")
      }
    })
  })

  // --- Mobile Menu Toggle ---
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const mobileMenu = document.getElementById("mobileMenu")

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden")
    })
  }
})
