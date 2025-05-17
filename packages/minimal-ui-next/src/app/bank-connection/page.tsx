"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Search, Building, Globe } from "lucide-react";
import { toast } from "sonner";

interface Country {
  id: string;
  name: string;
}

interface Bank {
  id: string;
  name: string;
  logo?: string;
}

export default function BankConnection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch supported countries
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch('/api/gocardless/countries');
        
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast.error('Failed to load supported countries. Please try again later.');
      } finally {
        setIsLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

  // Fetch banks when country is selected
  useEffect(() => {
    if (!selectedCountry) return;
    
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const response = await fetch(`/api/gocardless/banks?country=${selectedCountry}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch banks');
        }
        
        const data = await response.json();
        setBanks(data.banks || []);
        setFilteredBanks(data.banks || []);
      } catch (error) {
        console.error('Error fetching banks:', error);
        toast.error('Failed to load banks. Please try again later.');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    
    fetchBanks();
  }, [selectedCountry]);

  // Filter banks when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBanks(banks);
      return;
    }
    
    const filtered = banks.filter(bank => 
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBanks(filtered);
  }, [searchQuery, banks]);

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedBank("");
    setSearchQuery("");
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
  };

  const handleConnect = async () => {
    if (!selectedCountry || !selectedBank) {
      toast.error('Please select both a country and a bank');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const response = await fetch('/api/gocardless/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: selectedCountry,
          bankId: selectedBank,
          accountId: accountId || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect to bank');
      }
      
      const data = await response.json();
      
      // Store the requisition ID in session storage for the callback to use
      if (typeof window !== 'undefined' && data.requisitionId) {
        window.sessionStorage.setItem('gocardless_requisition_id', data.requisitionId);
        if (accountId) {
          window.sessionStorage.setItem('gocardless_account_id', accountId);
        }
      }
      
      // Redirect to the bank's authentication page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL provided');
      }
    } catch (error) {
      console.error('Error connecting to bank:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate bank connection. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="container max-w-3xl py-10">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6" 
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Link Bank Account</CardTitle>
          <CardDescription>
            Connect your bank account to automatically sync transactions.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Select your country</Label>
            <div className="flex items-start gap-2">
              <div className="relative w-full">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select
                  disabled={isLoadingCountries}
                  value={selectedCountry}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger id="country" className="pl-10">
                    {isLoadingCountries ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading countries...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select country" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Bank Selection (shown only if country is selected) */}
          {selectedCountry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-bank">Find your bank</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-bank"
                    placeholder="Search by bank name"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoadingBanks}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Select your bank</div>
                
                {isLoadingBanks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Loading banks...</span>
                  </div>
                ) : filteredBanks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No banks found for this search. Please try a different term.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                    {filteredBanks.map((bank) => (
                      <div
                        key={bank.id}
                        className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
                          selectedBank === bank.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => handleBankSelect(bank.id)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center mr-3">
                          {bank.logo ? (
                            <img
                              src={bank.logo}
                              alt={bank.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Building className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bank.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goBack}>Cancel</Button>
          <Button 
            onClick={handleConnect} 
            disabled={!selectedCountry || !selectedBank || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Link Bank in Browser'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 