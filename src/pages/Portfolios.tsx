import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Eye, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Portfolios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ name: "", description: "" });

  const { data: portfolios, isLoading } = useQuery({
    queryKey: ["portfolios", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (portfolio: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user?.id,
          name: portfolio.name,
          description: portfolio.description,
          positions: [],
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({ title: "Portfolio created successfully" });
      setIsCreateDialogOpen(false);
      setNewPortfolio({ name: "", description: "" });
    },
    onError: (error) => {
      toast({ title: "Failed to create portfolio", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (portfolioId: string) => {
      const { error } = await supabase.from("portfolios").delete().eq("id", portfolioId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({ title: "Portfolio deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete portfolio", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Portfolios
          </h1>
          <p className="text-muted-foreground mt-2">Manage your investment portfolios</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Portfolio</DialogTitle>
              <DialogDescription>Add a new portfolio to track your investments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Growth Portfolio"
                  value={newPortfolio.name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your portfolio strategy..."
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate(newPortfolio)}
                disabled={!newPortfolio.name || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Portfolio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {portfolios && portfolios.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
              </motion.div>
              <p className="text-muted-foreground mb-4">No portfolios yet. Create your first one!</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Portfolio
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios?.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            >
              <Card className="bg-card/40 backdrop-blur-xl border-border/30 hover:border-border/60 transition-all">
                <CardHeader>
                  <CardTitle className="text-foreground">{portfolio.name}</CardTitle>
                  <CardDescription>{portfolio.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="text-foreground">Positions: {Array.isArray(portfolio.positions) ? portfolio.positions.length : 0}</p>
                    <p className="text-xs mt-1">
                      Created: {new Date(portfolio.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/csv-visualizer?portfolioId=${portfolio.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(portfolio.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
