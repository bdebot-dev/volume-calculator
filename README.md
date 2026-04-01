# Timber Volume Calculator

A standalone HTML, CSS, and JavaScript application for calculating geometric volumes and forestry cubage with business rules tailored to timber operations.

## Features

### Geometric solids
The application can calculate the volume of:
- Cylinder
- Cone frustum
- Rectangular prism
- Cone
- Sphere

### Forestry cubage
The application supports three standard log cubage methods:
- Smalian
- Huber
- Newton

### Units
Input dimensions can be entered in:
- millimeters
- centimeters
- meters

All length inputs are automatically converted to meters before calculation.

## Business logic

The forestry module is designed around a domain-specific distinction between **softwoods** and **hardwoods**.

### 1. Raw forestry volume
For Smalian, Huber, and Newton, the computed log volume is treated as:

- **m³ over bark**

This is the starting forestry volume.

### 2. Softwoods
For **softwoods**, the application also calculates:

- **m³S under bark**

The under-bark volume is derived using a fixed bark deduction of **12%**:

```text
m³S = m³ over bark × 0.88