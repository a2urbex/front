<script setup>
import { ref } from 'vue';
import { useLocationStore } from '@/stores/location';

const locationStore = useLocationStore();

const name = ref('');
const description = ref('');
const image = ref(null);
const lat = ref('');
const lon = ref('');
const imagePreview = ref(null); 

const currentStep = ref(1);
const totalSteps = 5;

const handleFileChange = (event) => {
  const file = event.target.files[0];
  image.value = file;
  if (file) {
    imagePreview.value = URL.createObjectURL(file);
  }
};

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const submitForm = () => {
  const formData = new FormData();
  formData.append('name', name.value);
  formData.append('description', description.value);
  formData.append('image', image.value);
  formData.append('lat', lat.value);
  formData.append('lon', lon.value);

  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  locationStore.addLocation(formData);
};

</script>

<template>
    <transition name="map" mode="out-in" appear>
    <div class="location-add">
        <div class="location-add__title center">
        <h2>Add location (temp)</h2>
        <p>Step {{ currentStep }} of {{ totalSteps }}</p>
        </div>
        <div class="location-add__content">
        <form @submit.prevent="submitForm" class="form">
            <!-- Step 1: Name -->
            <div v-if="currentStep === 1" class="form-group">
            <input class="form-input" placeholder=" " type="text" id="name" v-model="name" required />
            <label class="form-label" for="name">Name:</label>
            </div>

            <!-- Step 2: Description -->
            <div v-if="currentStep === 2" class="form-group">
            <input class="form-input" placeholder=" " id="description" v-model="description" required />
            <label class="form-label" for="description">Description:</label>
            </div>

            <!-- Step 3: Image -->
            <div v-if="currentStep === 3" class="form-group">
            <input class="form-input" placeholder=" " type="file" id="image" @change="handleFileChange" accept="image/*" />
            <label class="form-label" for="image">Image:</label>
            </div>
            <!-- Image preview section -->
            <div v-if="imagePreview && currentStep === 3" class="form-group">
            <img :src="imagePreview" alt="Image Preview" class="image-preview" />
            </div>

            <!-- Step 4: Latitude -->
            <div v-if="currentStep === 4" class="form-group">
            <input class="form-input" placeholder=" " type="text" id="lat" v-model="lat" required />
            <label class="form-label" for="lat">Latitude:</label>
            </div>

            <!-- Step 5: Longitude -->
            <div v-if="currentStep === 5" class="form-group">
            <input class="form-input" placeholder=" " type="text" id="lon" v-model="lon" required />
            <label class="form-label" for="lon">Longitude:</label>
            </div>

            <!-- Navigation buttons -->
            <div class="form-navigation">
            <button type="button" @click="prevStep" v-if="currentStep > 1">Previous</button>
            <button type="button" @click="nextStep" v-if="currentStep < totalSteps">Next</button>
            <button type="submit" v-if="currentStep === totalSteps">Submit</button>
            </div>
        </form>
        </div>
    </div>
    </transition>
</template>

<style lang="scss">
@import '../assets/styles/components/locationAdd.scss';
</style>
