import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.OPENROUTER_API_KEY || "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Add this debug function at the top
export async function GET(req: NextRequest) {
  console.log('GET request received - this should not happen');
  return NextResponse.json({ error: 'GET method not allowed' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  // Add debug logging
  console.log('=== API ROUTE DEBUG ===');
  console.log('POST request received successfully');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    console.log('Attempting to parse JSON body...');
    const body = await req.json();
    console.log('Request body parsed:', body);
    
    const info = normalize(body);
    console.log('Normalized info:', info);
    
    if (!info) {
      console.log('Invalid input - returning 400');
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cost = calculateCost(info);
    console.log('Cost calculated:', cost);
    
    // Enhanced prompt with detailed product information and weight considerations
    const [l, w, h] = info.dimensions.split('x').map(parseFloat);
    const [bl, bw, bh] = cost.boxSize.split('x').map(parseFloat);
    const paddingPerSide = ((bl - l) / 2).toFixed(1);
    const weight = parseFloat(info.weight);
    
    const prompt = `Product Packaging Analysis Request:

PRODUCT SPECIFICATIONS:
- Dimensions: ${info.dimensions} inches (L x W x H)
- Weight: ${info.weight} lbs
- Fragility Level: ${info.fragility}/5 (${fragility[info.fragility as keyof typeof fragility].level})
- Quantity Ordered: ${info.quantity} units

CALCULATED RECOMMENDATIONS:
- Recommended Box Size: ${cost.boxSize} inches
- Padding Added: ${paddingPerSide} inches per side for optimal protection
- Box Type: ${cost.boxType} (${cost.boxStrength})
- Required Materials: ${cost.materials.join(", ")}

DETAILED COST BREAKDOWN:
- Box Unit Cost: $${cost.boxUnitCost}
- Padding Materials Cost: $${cost.paddingUnitCost}
- Total Unit Cost (before discount): $${cost.unitCostBeforeDiscount}
- Bulk Discount Applied: ${cost.discount}% (for ${info.quantity} units)
- Final Unit Cost: $${cost.unitCost}
- Total Order Cost: $${cost.totalCost}

WEIGHT CONSIDERATIONS:
- Product Weight: ${weight} lbs
- Estimated Shipping Weight: ${cost.shippingWeight} lbs (including packaging)
- Weight Category: ${cost.weightCategory}

SUSTAINABILITY METRICS:
- Recycled Content: ${cost.recycledContent}%
- Box Recyclability: 100% recyclable corrugated cardboard
- Environmental Impact Score: ${cost.sustainabilityScore}/10

Please provide a packaging recommendation following the warehouse operations format with accurate supplier information. Focus on cost efficiency and damage prevention.
`;

    console.log('Making API call to OpenRouter...');
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${API_KEY}` 
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    console.log('OpenRouter response status:', response.status);
    const data = await response.json();
    console.log('OpenRouter response data:', data);
    
    if (!response.ok) {
      console.log('OpenRouter error:', data.error?.message || "AI service error");
      return NextResponse.json({ error: data.error?.message || "AI service error" }, { status: response.status });
    }

    console.log('Success - returning suggestion');
    return NextResponse.json({ suggestion: data.choices[0].message.content });
    
  } catch (error: any) {
    console.error('=== API ROUTE ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 });
  }
}

// Add handler for other methods
export async function PUT(req: NextRequest) {
  console.log('PUT request received - not allowed');
  return NextResponse.json({ error: 'PUT method not allowed' }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  console.log('DELETE request received - not allowed');
  return NextResponse.json({ error: 'DELETE method not allowed' }, { status: 405 });
}

const SYSTEM_PROMPT = `You are a packaging specialist. Provide clear, practical recommendations for warehouse operations.

Format as PLAIN TEXT with NO special formatting:

PACKAGING RECOMMENDATION

SOLUTION:
Box Size: [L x W x H inches]
Box Type: [Single/Double Wall with strength rating]
Padding: [Type and amount needed]
Pack Time: [X minutes per unit]

COST BREAKDOWN:
Box: $[amount] per unit
Padding: $[amount] per unit  
Total Unit Cost: $[amount]
Bulk Discount: [X%] for [quantity] units
Total Order Cost: $[amount]

SUPPLIER:
Uline Industrial Supply
Phone: 1-800-295-5510
Boxes:- https://www.uline.com/Product/GuidedNav?t=184360&dup=over
Bubble Wrap :- https://www.uline.com/BL_468/Uline-Industrial-Bubble-Rolls
Delivery: 1-2 business days

SUSTAINABILITY:
Recycled Content: [X%]
Fully Recyclable: Yes

This recommendation provides immediate implementation guidance for cost-effective packaging.`;


interface ProductInfo {
  dimensions?: string;
  weight?: string;
  fragility?: string;
  quantity?: string;
}

// Updated fragility levels with better descriptions and more accurate multipliers
const fragility = {
  "1": { level: "Very Low (Books, Clothing, Non-fragile items)", mult: 0.5, description: "Minimal protection needed" }, 
  "2": { level: "Low (Small electronics, Toys)", mult: 1.0, description: "Basic protection required" },
  "3": { level: "Medium (Glassware, Medium electronics)", mult: 1.8, description: "Standard cushioning needed" }, 
  "4": { level: "High (Large electronics, Artwork)", mult: 2.5, description: "Enhanced protection required" },
  "5": { level: "Very High (Precision instruments, Antiques)", mult: 3.2, description: "Maximum protection essential" },
};

// Updated materials with realistic Uline-based pricing (as of 2025)
const materials = {
  // Box pricing based on size and wall strength
  singleWallBox: { name: "Single Wall Corrugated (200 lb test)", baseCost: 0.85, sizeMultiplier: 0.12 },
  doubleWallBox: { name: "Double Wall Corrugated (275 lb test)", baseCost: 1.45, sizeMultiplier: 0.18 },
  heavyDutyBox: { name: "Heavy Duty Double Wall (500 lb test)", baseCost: 2.25, sizeMultiplier: 0.25 },
  
  // Cushioning materials with realistic costs
  bubbleWrap: { name: "Bubble Wrap (3/16\" small bubble)", cost: 0.35, coverage: 2 }, // per sq ft
  airBubble: { name: "Air Bubble Cushioning (1/2\" large bubble)", cost: 0.45, coverage: 1.8 },
  paperFill: { name: "Crinkle Paper Fill", cost: 0.15, coverage: 3 },
  corrugatedInserts: { name: "Corrugated Inserts/Dividers", cost: 0.65, coverage: 1 },
  foamInserts: { name: "Custom Foam Inserts", cost: 1.25, coverage: 1 },
  voidFill: { name: "Biodegradable Void Fill", cost: 0.25, coverage: 2.5 },
  
  // Sealing and finishing
  packingTape: { name: "2\" Packing Tape", cost: 0.08 },
  labels: { name: "Shipping Labels", cost: 0.05 },
};

// More realistic bulk pricing tiers based on actual Uline volume discounts
const discounts = { 
  1: 1.0,      // No discount
  25: 0.95,    // 5% discount at 25 units
  100: 0.88,   // 12% discount at 100 units  
  250: 0.82,   // 18% discount at 250 units
  500: 0.76,   // 24% discount at 500 units
  1000: 0.70,  // 30% discount at 1000+ units
  2500: 0.65   // 35% discount at 2500+ units
};

function normalize(body: ProductInfo) {
  const { dimensions, weight, fragility, quantity } = body;
  
  if (!dimensions || !weight || !fragility || !quantity) return null;
  
  // Parse dimensions with better error handling
  const dimNums = dimensions.match(/\d+(\.\d+)?/g);
  if (!dimNums || dimNums.length !== 3) return null;
  let [l, w, h] = dimNums.map(parseFloat);
  
  // Convert cm to inches if needed
  if (dimensions.toLowerCase().includes('cm')) {
    l *= 0.393701; w *= 0.393701; h *= 0.393701;
  }
  
  // Parse weight with better unit handling
  const weightMatch = weight.match(/\d+(\.\d+)?/);
  if (!weightMatch) return null;
  let weightVal = parseFloat(weightMatch[0]);
  const lw = weight.toLowerCase();
  if (lw.includes('kg')) weightVal *= 2.20462;
  else if (lw.includes('g') && !lw.includes('kg')) weightVal *= 0.00220462;
  else if (lw.includes('oz') && !lw.includes('lbs')) weightVal *= 0.0625;
  
  const fragNum = fragility.match(/\d+/)?.[0];
  const qtyNum = quantity.match(/\d+/)?.[0];
  if (!fragNum || !qtyNum || parseInt(fragNum) < 1 || parseInt(fragNum) > 5) return null;

  return {
    dimensions: `${l.toFixed(1)}x${w.toFixed(1)}x${h.toFixed(1)}`,
    weight: weightVal.toFixed(1),
    fragility: fragNum,
    quantity: qtyNum,
  };
}

function calculateCost(info: any) {
  const [l, w, h] = info.dimensions.split('x').map(parseFloat);
  const qty = parseInt(info.quantity);
  const fragLvl = parseInt(info.fragility);
  const weight = parseFloat(info.weight);
  
  // Calculate box requirements based on fragility
  const fragData = fragility[info.fragility as keyof typeof fragility];
  const paddingNeeded = fragData.mult;
  const [bl, bw, bh] = [l + paddingNeeded * 2, w + paddingNeeded * 2, h + paddingNeeded * 2];
  
  // Calculate volume for size-based pricing
  const volume = bl * bw * bh;
  const surfaceArea = 2 * (bl * bw + bw * bh + bh * bl);
  
  // Determine box type based on weight and fragility
  let boxType, boxCost, boxStrength;
  if (weight <= 10 && fragLvl <= 2) {
    boxType = materials.singleWallBox;
    boxStrength = "200 lb test Single Wall";
  } else if (weight <= 40 && fragLvl <= 4) {
    boxType = materials.doubleWallBox;
    boxStrength = "275 lb test Double Wall";
  } else {
    boxType = materials.heavyDutyBox;
    boxStrength = "500 lb test Heavy Duty";
  }
  
  // Calculate box cost based on volume
  const volumeMultiplier = Math.max(1, volume / 1000);
  boxCost = boxType.baseCost + (boxType.sizeMultiplier * volumeMultiplier);
  
  // Determine cushioning materials based on fragility
  const cushioningMaterials = [];
  let paddingCost = 0;
  
  if (fragLvl >= 2) {
    cushioningMaterials.push(materials.bubbleWrap.name);
    paddingCost += materials.bubbleWrap.cost * (surfaceArea / 144) / materials.bubbleWrap.coverage;
  }
  if (fragLvl >= 3) {
    cushioningMaterials.push(materials.voidFill.name);
    paddingCost += materials.voidFill.cost * (volume / 1728) / materials.voidFill.coverage;
  }
  if (fragLvl >= 4) {
    cushioningMaterials.push(materials.corrugatedInserts.name);
    paddingCost += materials.corrugatedInserts.cost;
  }
  if (fragLvl === 5) {
    cushioningMaterials.push(materials.foamInserts.name);
    paddingCost += materials.foamInserts.cost;
  }
  
  // Add tape and labels
  const tapeCost = materials.packingTape.cost;
  const labelCost = materials.labels.cost;
  

  // Total costs before discount
  const materialCost = boxCost + paddingCost + tapeCost + labelCost;
  const totalUnitCostBeforeDiscount = materialCost ;
  
  // Apply bulk discount
  const discountTier = Object.keys(discounts).map(k => parseInt(k)).sort((a, b) => b - a).find(k => qty >= k) || 1;
  const discountMultiplier = discounts[discountTier as keyof typeof discounts];
  const discountPercent = Math.round((1 - discountMultiplier) * 100);
  
  const finalUnitCost = totalUnitCostBeforeDiscount * discountMultiplier;
  const totalCost = finalUnitCost * qty;
  
  // Calculate shipping weight (product + packaging materials)
  const packagingWeight = (volume / 1728) * 0.5 + paddingCost * 0.1; // rough estimate
  const shippingWeight = weight + packagingWeight;
  
  // Determine weight category for shipping
  let weightCategory;
  if (shippingWeight <= 1) weightCategory = "Light Package";
  else if (shippingWeight <= 10) weightCategory = "Standard Package";
  else if (shippingWeight <= 50) weightCategory = "Heavy Package";
  else weightCategory = "Freight Package";
  
  // Calculate sustainability metrics
  const recycledContent = fragLvl <= 2 ? 70 : fragLvl <= 4 ? 65 : 60; // Less recycled content for high-protection materials
  const sustainabilityScore = Math.round((recycledContent / 10) + (10 - fragLvl));
  
  return {
    boxSize: `${bl.toFixed(1)}x${bw.toFixed(1)}x${bh.toFixed(1)}`,
    boxType: boxType.name,
    boxStrength: boxStrength,
    materials: [boxType.name, ...cushioningMaterials, "Packing Tape", "Shipping Labels"],
    boxUnitCost: Math.round(boxCost * 100) / 100,
    paddingUnitCost: Math.round(paddingCost * 100) / 100,
    unitCostBeforeDiscount: Math.round(totalUnitCostBeforeDiscount * 100) / 100,
    unitCost: Math.round(finalUnitCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    discount: discountPercent,
    volume: volume.toFixed(0),
    surfaceArea: surfaceArea.toFixed(0),
    shippingWeight: shippingWeight.toFixed(1),
    weightCategory: weightCategory,
    recycledContent: recycledContent,
    sustainabilityScore: sustainabilityScore,
    discountTier: discountTier,
    paddingNeeded: paddingNeeded.toFixed(1),
  };
}