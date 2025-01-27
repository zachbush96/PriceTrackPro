import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";

// Middleware for API authentication
function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header("Authorization");

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const expectedApiKey = "ThisIsMyPassword1!";

  if (!expectedApiKey) {
    console.error("AUTH_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (apiKey !== expectedApiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // If the API key is valid, proceed to the next middleware or route handler
  next();
}

export function registerRoutes(app: Express): Server {
  // Get all tracked items
  app.get("/api/items", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Add new price point with authentication
  app.post("/api/prices", authenticateApiKey, async (req, res) => {
    const { item_id, price, date } = req.body;
    try {
      const { error } = await supabase
        .from('prices')
        .insert({
          item_id,
          price,
          date,
        });

      if (error) throw error;
      res.status(201).json({ message: "Price added successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to add price: " + error.message" });
    }
  });

  // Get prices for a specific item
  app.get("/api/prices/:itemId", async (req, res) => {
    const { itemId } = req.params;
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('item_id', itemId)
        .order('date');

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // Get latest prices for all items
  app.get("/api/prices/latest", async (req, res) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id');

      if (itemsError) throw itemsError;

      const latestPrices = await Promise.all(
        items.map(async (item) => {
          const { data, error } = await supabase
            .from('prices')
            .select('*')
            .eq('item_id', item.id)
            .order('date', { ascending: false })
            .limit(1);

          if (error) throw error;
          return data[0];
        })
      );

      res.json(latestPrices.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest prices" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
