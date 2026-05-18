-- LocalScript
-- Put in StarterPlayerScripts or execute client-side

local Players = game:GetService("Players")
local player = Players.LocalPlayer

local spawnsFolder = workspace:WaitForChild("CrystaliteSpawns")

local TARGET_COLORS = {
	Blue = BrickColor.new("Cyan").Color,
	Green = Color3.fromRGB(41, 193, 0),
	Orange = Color3.fromRGB(255, 115, 0),
}

local function getCharacter()
	local character = player.Character or player.CharacterAdded:Wait()
	local hrp = character:WaitForChild("HumanoidRootPart")
	return character, hrp
end

local function colorsClose(color1, color2)
	local tolerance = 0.02

	return math.abs(color1.R - color2.R) <= tolerance
		and math.abs(color1.G - color2.G) <= tolerance
		and math.abs(color1.B - color2.B) <= tolerance
end

local function getCrystalColor(crystal)
	if crystal:IsA("BasePart") then
		return crystal.Color
	end

	for _, descendant in ipairs(crystal:GetDescendants()) do
		if descendant:IsA("BasePart") then
			return descendant.Color
		end
	end

	return nil
end

local function getCrystalPosition(crystal)
	if crystal:IsA("BasePart") then
		return crystal.Position
	end

	if crystal:IsA("Model") then
		if crystal.PrimaryPart then
			return crystal.PrimaryPart.Position
		end

		local part = crystal:FindFirstChildWhichIsA("BasePart", true)
		if part then
			return part.Position
		end
	end

	return nil
end

local function findCrystalitesByColor(targetColor)
	local matches = {}

	for i = 1, 226 do
		local spawn = spawnsFolder:FindFirstChild("Spawn" .. i)

		if spawn then
			local crystal = spawn:FindFirstChild("CrystaliteTemplate")

			if crystal then
				local crystalColor = getCrystalColor(crystal)

				if crystalColor and colorsClose(crystalColor, targetColor) then
					table.insert(matches, crystal)
				end
			end
		end
	end

	return matches
end

local function teleportToRandomCrystal(colorName)
	local targetColor = TARGET_COLORS[colorName]
	if not targetColor then return end

	local crystals = findCrystalitesByColor(targetColor)

	if #crystals == 0 then
		warn("No active " .. colorName .. " CrystaliteTemplates found.")
		return
	end

	local chosenCrystal = crystals[math.random(1, #crystals)]
	local position = getCrystalPosition(chosenCrystal)

	if not position then
		warn("Could not get position for chosen crystalite.")
		return
	end

	local _, hrp = getCharacter()

	hrp.CFrame = CFrame.new(position + Vector3.new(0, 5, 0))
end

-- UI creation
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "CrystaliteTeleportUI"
screenGui.ResetOnSpawn = false
screenGui.Parent = player:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 180, 0, 160)
frame.Position = UDim2.new(0, 20, 0.5, -80)
frame.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
frame.BorderSizePixel = 0
frame.Parent = screenGui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 10)
corner.Parent = frame

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 35)
title.BackgroundTransparency = 1
title.Text = "Crystalite TP"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextScaled = true
title.Font = Enum.Font.GothamBold
title.Parent = frame

local function makeButton(name, yPosition, color)
	local button = Instance.new("TextButton")
	button.Size = UDim2.new(1, -20, 0, 35)
	button.Position = UDim2.new(0, 10, 0, yPosition)
	button.BackgroundColor3 = color
	button.Text = name
	button.TextColor3 = Color3.fromRGB(255, 255, 255)
	button.TextScaled = true
	button.Font = Enum.Font.GothamBold
	button.BorderSizePixel = 0
	button.Parent = frame

	local buttonCorner = Instance.new("UICorner")
	buttonCorner.CornerRadius = UDim.new(0, 8)
	buttonCorner.Parent = button

	button.MouseButton1Click:Connect(function()
		teleportToRandomCrystal(name)
	end)

	return button
end

makeButton("Blue", 45, Color3.fromRGB(0, 255, 255))
makeButton("Green", 85, Color3.fromRGB(41, 193, 0))
makeButton("Orange", 125, Color3.fromRGB(255, 115, 0))
